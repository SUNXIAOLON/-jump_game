/*
 * @Author: aaaa aaaa
 * @Date: 2024-07-23 20:03:10
 * @LastEditors: aaaa aaaa
 * @LastEditTime: 2024-08-04 12:05:11
 * @FilePath: \running_game\src\views\home\js\model.js
 * @Description: 
 */
import { SceneLoader } from "@babylonjs/core"
import { OBJFileLoader } from "@babylonjs/loaders";
export const importGLB = (scene, name) => {
    OBJFileLoader.OPTIMIZE_WITH_UV = true;
    return new Promise((resove, reject) => {
        SceneLoader.ImportMeshAsync("", "models/", name, scene)
            .then((meshes) => {
                resove(meshes)
            }).catch(reject).finally(() => {

            })
    })
}