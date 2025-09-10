// Width of a toolbar button
export const BUTTON_SIZE = 34;
// Width of the margin around group of buttons
const GROUP_MARGIN = 12;
export const TOTAL_GROUP_MARGIN = GROUP_MARGIN * 2;
// Width of a gap between groups elements
export const GAP_INSIDE_GROUP = 8;
// Width of tabs and views switchers. This is the width of the stable toolbar elements on the left side of the flexible part
const LEFT_TOOLBAR_BLOCK_WIDTH = 236 + 110;
// Width of undo/redo section, used in the content view
const UNDO_REDO_SECTION_WIDTH = 100;
// Width of search and undo/redo buttons. This is the width of the stable toolbar elements on the right side of the flexible part
const RIGHT_TOOLBAR_BLOCK_WIDTH = 150 + UNDO_REDO_SECTION_WIDTH;
// Width of hidden menu button
const MENU_BUTTON_WIDTH = BUTTON_SIZE + TOTAL_GROUP_MARGIN;
export const ALWAYS_VISIBLE_PARTS_WIDTH = LEFT_TOOLBAR_BLOCK_WIDTH + RIGHT_TOOLBAR_BLOCK_WIDTH + MENU_BUTTON_WIDTH;
