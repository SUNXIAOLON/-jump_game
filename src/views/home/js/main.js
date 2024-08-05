/*
 * @Author: aaaa aaaa
 * @Date: 2024-08-02 22:00:11
 * @LastEditors: aaaa aaaa
 * @LastEditTime: 2024-08-04 11:08:51
 * @FilePath: \running_game\src\views\home\js\main.js
 * @Description: 
 */
/*
 * @Author: aaaa aaaa
 * @Date: 2024-07-23 20:13:35
 * @LastEditors: aaaa aaaa
 * @LastEditTime: 2024-08-04 10:55:22
 * @FilePath: \running_game\src\views\home\js\main.js
 * @Description: 
 */
import { importGLB } from "./model.js"
import { DebugViewer } from "./debug.js"
import { HemisphericLight, Vector3, ArcRotateCamera, Scalar, Engine, Scene, Mesh, GlowLayer, DynamicTexture, MeshBuilder, Ray, RayHelper, StandardMaterial, Space, Texture, HavokPlugin, PhysicsMotionType, PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core"
import { FireProceduralTexture } from "@babylonjs/procedural-textures"
import { FPSUI } from "./GUI.js"
class RoleAnimation {
    animationGroupMap = new Map()
    #activeAni = null;
    stopRemains() {
        let arr = this.animationGroupMap.keys();
        for (const k of arr) {
            if (k != this.#activeAni) {
                const oldAni = this.animationGroupMap.get(k);
                if (oldAni.weight > 0) {
                    oldAni.weight = Scalar.Clamp(
                        oldAni.weight - 0.05,
                        0,
                        1
                    )
                }

            }
        }

    }
    setAniName(name) {
        if (!name) {
            this.#activeAni = "stand"
            return;
        }
        this.#activeAni = name;

    }
    start() {
        if (this.animationGroupMap.get(this.#activeAni)) {
            const curAnimParam = this.animationGroupMap.get(this.#activeAni);
            if (curAnimParam.weight < 1) {
                curAnimParam.weight = Scalar.Clamp(
                    curAnimParam.weight + 0.05,
                    0,
                    1
                )
                this.stopRemains()
            }

        }

    }
}
export class Main {
    //初始化场景
    static #keyDownW = "keyw"
    static #keyDownA = "keya"
    static #keyDownS = "keys"
    static #keyDownD = "keyd"
    static #keyDownSPACE = "space"
    static #toNextLevel = false;
    static barrier = 1;
    static #scene;
    static #engine;
    static #startGround;
    static #roleAnimation = new RoleAnimation();
    static #role;
    static #loadRoleEnd = false;
    static async init(canvas) {
        const engine = new Engine(canvas, true);
        const scene = new Scene(engine);
        scene.registerBeforeRender(this.#sceneBeforeRender.bind(this));
        scene.onBeforeAnimationsObservable.add(this.#sceneAnimationsObservable.bind(this))
        // scene.onPointerObservable.add((e) => {
        //     console.log(e.pickInfo.pickedMesh)
        // }, PointerEventTypes.POINTERDOWN);
        this.#engine = engine;
        this.#scene = scene;
        engine.runRenderLoop(this.#renderLoop);
        this.#createCamera(scene, canvas);
        this.#createLight(scene);
        await this.#havokPlugin(scene)
        DebugViewer.initViewer(scene)
        this.enterTheLevel(scene)
        this.#keyboard()
        //鼠标聚焦
        const lock = () => {
            if (document.pointerLockElement) {
                return;
            }
            canvas.requestPointerLock =
                canvas.requestPointerLock ||
                canvas.msRequestPointerLock ||
                canvas.mozRequestPointerLock ||
                canvas.webkitRequestPointerLock ||
                false;
            if (canvas.requestPointerLock) {
                canvas.requestPointerLock();
            }
        }
        canvas.addEventListener("click", lock)
    }
    static #renderLoop() {
        Main.#scene.render();
    }
    static #createLight(scene) {
        const light = new HemisphericLight("light", new Vector3(0, 30, 0), scene);
        light.intensity = 1;
    }
    static #createCamera(scene, canvas) {
        const camera = new ArcRotateCamera("camera", 0, 0, 0, new Vector3(0, 20, 0), scene);
        camera.upperBetaLimit = Math.PI / 2.2;
        camera.attachControl(canvas, true);
    }
    static nextLevel() {
        this.#toNextLevel = true;
        //进入下一关
        ++this.barrier
        setTimeout(() => {
            this.enterTheLevel()
        }, 2000)
    }
    static async enterTheLevel() {
        const scene = this.#scene;
        const meshes = scene.meshes;
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            if (mesh.name.indexOf("ground") > -1) {
                mesh.physicsBody.dispose();
                mesh.dispose(false, true)
            }
        }
        this.#createGround(scene);
        this.#createBorder(scene)
        await this.#importModel(scene)
        this.#toNextLevel = false;
    }
    //判断是否接触到魔方钥匙
    static #unlockingKeyPosition = null;
    static #contactUnlockingKey() {
        if (this.#role && this.#unlockingKeyPosition && !this.#toNextLevel) {
            const rolePosition = this.#role.getAbsolutePosition();
            // 计算从模型A指向模型B的方向向量
            var directionVector = rolePosition.subtract(this.#unlockingKeyPosition).normalize();
            // 获取模型A在其局部坐标系中的朝向向量
            var forwardVector = this.#role.forward.normalize();
            // 计算这两个向量之间的夹角
            var angleRadians = Math.acos(forwardVector.dot(directionVector));
            // 转换为度数
            var angleDegrees = angleRadians * (180 / Math.PI);
            const distance = Vector3.Distance(rolePosition, this.#unlockingKeyPosition);
            if (angleDegrees > 170 && angleDegrees < 173 && distance < 5) {
                this.#roleAnimation.setAniName("touch")
                // console.log(distance, '到魔方附近')
                this.nextLevel()
            }
        }
    }
    //导入魔方钥匙模型
    static #unlockingMesh = null;
    static async #creatUnlockingKey(position) {
        if (this.#unlockingMesh) {
            this.#unlockingMesh.position = position;
            this.#unlockingMesh.position.y += 3;
            this.#unlockingKeyPosition = this.#unlockingMesh.position.clone()
            return;
        }
        const { meshes } = await importGLB(this.#scene, "rubiks_cube.glb")
        this.#unlockingMesh = meshes[0];
        meshes[0].position = position;
        meshes[0].position.y += 3;
        this.#unlockingKeyPosition = meshes[0].position.clone()
        //发光
        const gl = new GlowLayer("glow", this.#scene, {
            mainTextureFixedSize: 1024,
            blurKernelSize: 64,
        });
        gl.intensity = 1.5;
    }
    static createTexture(text) {
        var textureGround = new DynamicTexture("dynamic texture", { width: 512, height: 256 }, this.#scene);
        var materialGround = new StandardMaterial("Mat", this.#scene);
        materialGround.diffuseTexture = textureGround;
        var font = "bold 104px monospace";
        textureGround.drawText(text, 75, 135, font, "green", "white", true, true);
        return materialGround
    }
    //创建立方体
    static #createGround(scene) {
        const materials = Array.from(Array(6)).map((item, index) => {
            const mat = new StandardMaterial("mat" + index, scene);
            const texture = new Texture(`/texture/${index + 1}.jpg`, scene);
            mat.diffuseTexture = texture;
            return mat;
        })
        const options = {
            sideOrientation: Mesh.DOUBLESIDE,
            width: 4,
            height: 2,
            depth: 4,
        }
        const sum = 5;
        let j = 0;
        let num = 20 * this.barrier
        while (j < num) {
            const endNum = num - sum;
            let mesh = null;
            if (j >= endNum) {
                //把最后一个变大点
                mesh = MeshBuilder.CreateBox(`ground${j}`, {
                    sideOrientation: Mesh.DOUBLESIDE,
                    width: 7,
                    height: 2,
                    depth: 7,
                }, scene);
            } else {
                mesh = MeshBuilder.CreateBox(`ground${j}`, options, scene)
            }
            mesh.position.z = (Math.random() * sum + sum + 2) * -1;
            mesh.position.x += j
            if (j === 0) {
                this.#startGround = mesh;
            }
            mesh.material = materials[Math.floor(Math.random() * 6)];
            // mesh.material = this.createTexture(j)
            let aggregate = new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass: 0, friction: 0.3 }, scene);
            aggregate.body.setMotionType(PhysicsMotionType.STATIC);
            // DebugViewer.viewer.showBody(aggregate.body);
            aggregate.body.setCollisionCallbackEnabled(true)

            if (j >= endNum) {
                this.#creatUnlockingKey(mesh.position.clone())
            }
            j += sum;
        }

    }
    //创建地面边界
    static #createBorder(scene) {
        const ground = MeshBuilder.CreateGround("borderGround", { width: 1000, height: 1000 }, scene); //scene is optional and defaults to the current scene
        ground.position.y = -5
        const fireMaterial = new StandardMaterial("fontainSculptur2", scene);
        const fireTexture = new FireProceduralTexture("fire", 256, scene);
        fireMaterial.diffuseTexture = fireTexture;
        fireMaterial.opacityTexture = fireTexture;
        ground.material = fireMaterial;
        let aggregate = new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0, friction: 0.3 }, scene);
        aggregate.body.setMotionType(PhysicsMotionType.STATIC);
        // DebugViewer.viewer.showBody(aggregate.body);
        aggregate.body.setCollisionCallbackEnabled(true)

    }
    static #createFPS() {
        const fps = this.#engine.getFps();
        FPSUI.createUI(this.#scene, parseInt(fps))
    }
    //设置物理引擎
    static async #havokPlugin(scene) {
        const h = await HavokPhysics()
        const hk = new HavokPlugin(true, h);
        // Havok is now available
        scene.enablePhysics(new Vector3(0, -9.81, 0), hk);
        // hk.onCollisionObservable.add(RoleHavokPlugin.onCollisionObservable);
        return hk;
    }
    static #sceneAnimationsObservable() {
        this.#roleAnimation.start()
    }
    static #sceneBeforeRender() {
        this.#roleLookAt()
        this.#createFPS()
        if (!this.#toNextLevel) {
            this.#loopSetLinearVelocity()
            this.#loopKeyDown()
            this.#contactUnlockingKey()
        }
    }
    //模型导入
    static async  #importModel(scene) {
        if (this.#role) {
            this.#role.physicsBody.disablePreStep = false;
            this.#role.physicsBody.updateBodyInstances()
            this.#role.position = this.#startGround.position.clone();
            this.#role.position.y += 5;
            setTimeout(() => {
                this.#role.physicsBody.disablePreStep = true;
                this.#role.physicsBody.updateBodyInstances()
            }, 100)
            return;
        }
        const { meshes, animationGroups } = await importGLB(scene, "female_specops.glb")
        // console.log(animationGroups)
        // meshes[0].position = this.#startGround.position.clone();
        if (animationGroups.length > 0) {
            for (let i = 0; i < animationGroups.length; i++) {
                animationGroups[i].setWeightForAllAnimatables(0);
                animationGroups[i].play(true);
                animationGroups[i].blendingSpeed = true;
                animationGroups[i].enableBlending = true;
                this.#roleAnimation.animationGroupMap.set(animationGroups[i].name, animationGroups[i])
            }
            this.#roleAnimation.setAniName("stand")
        }
        // console.log(animationGroups)
        //获取跟节点
        function getRoot(mesh) {
            let root = mesh;
            if (!root.parent) {
                return root;
            }
            return getRoot(root.parent);
        }
        const root = getRoot(meshes[0]);
        const player = MeshBuilder.CreateBox("role", { height: 5, width: 1, }, scene);
        player.visibility = 0;
        this.#role = player;
        // const position = this.#startGround;
        player.position = this.#startGround.position.clone();
        player.position.y += 5;
        root.parent = player;
        root.position = new Vector3(0.1, -2.5, 0)
        //相机指向角色
        const camera = scene.cameras[0];
        camera.lockedTarget = player;
        camera.alpha = -1.5;
        camera.beta = 1.5;
        camera.radius = 5;
        /**关联角色物理引擎
      */
        let groundAggregate = new PhysicsAggregate(player, PhysicsShapeType.CAPSULE, { friction: 0.8, mass: 2, radius: 0.5, }, scene);
        // DebugViewer.viewer.showBody(groundAggregate.body);
        groundAggregate.body.setMassProperties({
            inertia: new Vector3(0, 0, 0),
        });
        // groundAggregate.body.disablePreStep = false;
        groundAggregate.body.getCollisionEndedObservable().add(this.#physicsAggregateEndCallback.bind(this))
        groundAggregate.body.getCollisionObservable().add(this.#physicsAggregateCallback.bind(this))
        this.#loadRoleEnd = true;
    }
    static #roleLookAt() {
        if (this.#loadRoleEnd) {
            const cameraDirection = this.#scene.cameras[0].getForwardRay().direction;
            const d = new Vector3(cameraDirection.x * 1, 0, cameraDirection.z * 1);
            this.#role.lookAt(this.#role.position.add(d), 0, 0, 0)
        }

    }
    static #keyMap = new Map();
    static #keyboard() {
        window.addEventListener("keydown", (e) => {
            const key = e.code.toLowerCase();
            if (!this.#keyMap.has(key)) {
                const keys = this.#keyMap.keys();
                for (const _key of keys) {
                    if (this.#keyMap.get(_key) === 1) {
                        this.#keyMap.set(_key, 0.5)
                        continue;
                    }
                    this.#keyMap.set(_key, 0)
                }
                this.#keyMap.set(key, 1)
            }
        })
        window.addEventListener("keyup", this.#keyboardUp.bind(this))
    }
    static #keyboardUp(e) {
        const key = e.code.toLowerCase();
        if (this.#keyMap.has(key)) {
            //权重为1 将0.5权重改为 1
            if (this.#keyMap.get(key) === 1) {
                this.#keyMap.delete(key)
                const keys = this.#keyMap.keys();
                for (const _key of keys) {
                    if (this.#keyMap.get(_key) === 0.5) {
                        this.#keyMap.set(_key, 1)
                        break;
                    }
                }
            } else {
                this.#keyMap.delete(key)
            }

        }
        switch (key) {
            case this.#keyDownW:
                this.#forward.z = 0;
                break;
            case this.#keyDownA:
                this.#forward.x = 0
                break;
            case this.#keyDownD:
                this.#forward.x = 0
                break;
            case this.#keyDownS:
                this.#forward.z = 0
                break;
            case this.#keyDownSPACE:
                this.#forward.y = -1;
                break;
        }
    }
    static #loopKeyDown() {
        if (this.#keyMap.size === 0) {
            this.#roleAnimation.setAniName("")
            return;
        }
        const keys = this.#keyMap.keys();
        for (const key of keys) {
            // console.log(key)
            if (this.#keyMap.get(key) === 1) {
                this.#keyboardEvent(key)
            }
        }

    }
    static #keyboardEvent(key) {
        // const key = e.code.toLowerCase();
        switch (key) {
            case this.#keyDownW:
                return this.#keyW()
            case this.#keyDownA:
                return this.#keyA()
            case this.#keyDownD:
                return this.#keyD()
            case this.#keyDownS:
                return this.#keyS()
            case this.#keyDownSPACE:
                return this.#space()
        }
    }
    static #keyW() {
        this.#forward.z = 0;
        this.#setLinearVelocity(Vector3.Forward())
        this.#roleAnimation.setAniName("run")
    }
    static #keyA() {
        this.#forward.x = 0;
        this.#setLinearVelocity(Vector3.Left())
        this.#roleAnimation.setAniName("left")
    }
    static #keyD() {
        this.#forward.x = 0
        this.#setLinearVelocity(Vector3.Right())
        this.#roleAnimation.setAniName("right")
    }
    static #keyS() {
        this.#forward.z = 0;
        this.#setLinearVelocity(Vector3.Backward())
        this.#roleAnimation.setAniName("backward")
    }
    static #endJump = true;
    static #jumpTime = new Date().getTime();
    static #space() {
        // console.log("space",this.#endJump)

        if (new Date().getTime() - this.#jumpTime > 300) {
            this.#forward.y = -1;
            this.#jumpTime = new Date().getTime();
            return;
        }
        if (!this.#endJump) {
            // console.log("没结束跳远")
            return;
        }
        if (this.#endJump) {
            this.#roleAnimation.setAniName("jump")
            this.#forward.y = 1;
        }
        this.#jumpTime = new Date().getTime();
    }
    static #forward = Vector3.Down();
    static #setLinearVelocity(forward) {
        this.#forward.addToRef(forward, this.#forward);
    }
    static #loopSetLinearVelocity() {
        if (this.#role) {
            this.#role.physicsBody.setLinearVelocity(Vector3.TransformNormal(this.#forward, this.#role.getWorldMatrix()).scale(10));
            // const velocity = this.#role.physicsBody.getLinearVelocity();
        }
    }
    static #physicsAggregateCallback(collisionEvent) {
        if (collisionEvent.collidedAgainst.transformNode.id.indexOf("ground") > -1) {
            //接触地面
            // console.log("接触地面")
            this.#endJump = true;
        }
        if (collisionEvent.collidedAgainst.transformNode.id === "borderGround") {
            // alert("失败");
            this.barrier = 1;
            this.enterTheLevel()
        }
    }
    static #physicsAggregateEndCallback(collisionEvent) {
        if (collisionEvent.collidedAgainst.transformNode.id.indexOf("ground") > -1) {
            //离开地面
            // console.log("离开地面")
            this.#endJump = false;
        }

    }
}