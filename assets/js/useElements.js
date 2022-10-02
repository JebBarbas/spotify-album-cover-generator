// @ts-check

import { element, Exception } from "./utils.js"

/** Tamaño de la imagen final del canvas */
const IMAGE_SIZE = 500

/** Estado */
const state = {
    canvasSide: 0
}

/**
 * Permite usar un canvas y su contexto 2D
 * @returns {[HTMLCanvasElement, CanvasRenderingContext2D]}
 */
export function useCanvas(selector){
    /** @type {HTMLCanvasElement} */
    const canvas = element(selector)
    const ctx = canvas.getContext('2d') ?? Exception(`No se pudo obtener el contexto 2D de ${selector}`)

    return [canvas, ctx]
}

/**
 * Permite usar el canvas de preview y su contexto 2D
 * @returns {[HTMLCanvasElement, CanvasRenderingContext2D]}
 */
 export const usePreviewCanvas = () => useCanvas('#canvasPreview')

/**
 * Permite usar el canvas de resultados y su contexto 2D
 * @returns {[HTMLCanvasElement, CanvasRenderingContext2D]}
 */
 export const useRealCanvas = () => useCanvas('#canvasResult')
 
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
    state.canvasSide = Math.min(element('#widthReference').clientWidth - 32, IMAGE_SIZE)
}

/**
 * Regresa el tamaño del canvas que se usará
 */
export const useCanvasSide = () => state.canvasSide

/**
 * Regresa el tamaño final del canvas de la imagen que se descargará
 */
export const useRealCanvasSize = () => IMAGE_SIZE