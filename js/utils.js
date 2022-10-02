// @ts-check

/** 
 * Crea una nueva excepción
 * @returns {never}
*/
export function Exception(message){
    throw new Error(message)
}

/** 
 * Atajo para document.querySelector()
 * @param {string} selector - Selector tipo CSS del elemento
 * @returns {any}
 */
export function element(selector){
    return document.querySelector(selector) ?? Exception(`Element ${selector} isn't in DOM`)
}

/** 
 * Wraps HTML canvas text onto a canvas of fixed width
 * @param {CanvasRenderingContext2D} ctx - The context for the canvas we want to wrap text on
 * @param {string} text - The text we want to wrap.
 * @param {number} x - The X starting point of the text on the canvas.
 * @param {number} y - The Y starting point of the text on the canvas.
 * @param {number} maxWidth - The width at which we want line breaks to begin - i.e. the maximum width of the canvas.
 * @param {number} lineHeight - The height of each line, so we can space them below each other.
 * @returns {[string, number, number][]} - An array of [ lineText, x, y ] for all lines
 */
export function wrapText(ctx, text, x, y, maxWidth, lineHeight){
    // First, start by splitting all of our text into words, but splitting it into an array split by spaces
    let words = text.split(' ');
    let line = ''; // This will store the text of the current line
    let testLine = ''; // This will store the text when we add a word, to test if it's too long

    /** @type [string, number, number][] */
    let lineArray = []; // This is an array of lines, which the function will return

    // Lets iterate over each word
    for(let n = 0; n < words.length; n++) {
        // Create a test line, and measure it..
        testLine += `${words[n]} `;
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        // If the width of this test line is more than the max width
        if (testWidth > maxWidth && n > 0) {
            // Then the line is finished, push the current line into "lineArray"
            lineArray.push([line, x, y]);
            // Increase the line height, so a new line is started
            y += lineHeight;
            // Update line and test line to use this word as the first word on the next line
            line = `${words[n]} `;
            testLine = `${words[n]} `;
        }
        else {
            // If the test line is still less than the max width, then add the word to the current line
            line += `${words[n]} `;
        }
        // If we never reach the full max width, then there is only one line.. so push it into the lineArray so we return something
        if(n === words.length - 1) {
            lineArray.push([line, x, y]);
        }
    }
    // Return the line array
    return lineArray;
}

/** 
 * Slugifies a name to a safer download 
 * @param {string} name
*/
export function slugifyName(name){
    return name.toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Verifica si un archivo es valido y manda una retroalimentacion sobre el, en caso de
 * que sea valido, el valor de la retroalimentacion es el nombre del archivo
 * @param {File} file 
 * @returns {[boolean, string]}
 */
export function isValidFile(file){
    const validFormats = ['image']

    const fileFormat = file.type.split('/')[0]
    if(!validFormats.includes(fileFormat)){
        return [false, 'Tipo de archivo no compatible, agregue una imagen.']
    }

    return [true, file.name]
}