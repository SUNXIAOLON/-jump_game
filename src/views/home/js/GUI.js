import {AdvancedDynamicTexture,Button,Control,TextBlock   } from "@babylonjs/gui"
export class FPSUI {
    static fpsText;
    static createUI(scene,text) {
        if(FPSUI.fpsText){
           return FPSUI.fpsText.text = "FPS: " + text;
        }
        const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("FPSUI",true,scene);
        FPSUI.fpsText = new TextBlock();
        FPSUI.fpsText.text = "FPS: " + text;
        FPSUI.fpsText.color = "black";
        FPSUI.fpsText.fontSize = 50;
        FPSUI.fpsText.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_TOP
        FPSUI.fpsText.textHorizontalAlignment = TextBlock.VERTICAL_ALIGNMENT_BOTTOM
        advancedTexture.addControl(FPSUI.fpsText);
    }
}