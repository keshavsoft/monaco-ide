/**
 * Monaco IDE Single - jsonpathly V2 State Store
 * Clean reactive single source of truth for dual editors and UI state.
 */

export const state = {
    sourceEditor: null,  // Left Monaco Editor Instance (Source Document)
    resultEditor: null,  // Right Monaco Editor Instance (Query Output)
    monaco: null,        // Global Monaco namespace
    isWrapping: false    // Word wrap state
};

export default state;

