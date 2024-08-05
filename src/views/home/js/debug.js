import { PhysicsViewer, SkeletonViewer, UtilityLayerRenderer, RotationGizmo, PositionGizmo, ScaleGizmo, Mesh } from "@babylonjs/core"
import { StackPanel, Control, Checkbox, TextBlock, AdvancedDynamicTexture } from "@babylonjs/gui"
export class DebugViewer {
    static viewer;
    static initViewer(scene) {
        this.viewer = new PhysicsViewer(scene);
    }
}

