// @ts-check

import { element, Exception } from "./utils.js"

/** Estado */
const state = {
    canvasSide: 0
}

/**
 * Permite usar el canvas de resultados y su contexto 2S
 * @returns {[HTMLCanvasElement, CanvasRenderingContext2D]}
 */
export function useCanvas(){
    /** @type {HTMLCanvasElement} */
    const canvas = element('#canvasResult')
    const ctx = canvas.getContext('2d') ?? Exception(`No se pudo obtener el contexto 2D del canvas`)

    return [canvas, ctx]
}

/**
 * Te permite usar un input 
 * @param {string} selector - Selector tipo CSS del elemento que quieres
 * @returns {HTMLInputElement}
 */
export function useInput(selector){
    return element(selector)
}

/**
 * Te permite usar un botón
 * @param {string} selector 
 * @returns {HTMLButtonElement}
 */
export function useButton(selector){
    return element(selector)
}

/**
 * Sets the new value of the canvas side
 */
export function setCanvasSide(){
    state.canvasSide = Math.min(element('#widthReference').clientWidth - 32, 500)
}

/**
 * Regresa el tamaño del canvas que se usará
 */
export const useCanvasSide = () => state.canvasSide

