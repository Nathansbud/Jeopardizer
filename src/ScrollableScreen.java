import processing.core.PApplet;

public class ScrollableScreen {
    static PApplet gui;

    private float width;
    private float height;

    private float maxWidth;
    private float maxHeight = 1600;

    private float viewX = 0;
    private float viewY = 0;

    public void draw() {
        gui.fill(PApplet.unhex(JConstants.JEOPARDY_BLUE));
        gui.rect(0, 0, gui.width, gui.height);
        gui.fill(PApplet.unhex(JConstants.JEOPARDY_YELLOW));
    }

    public static PApplet getGui() {
        return gui;
    }
    public static void setGui(PApplet _gui) {
        gui = _gui;
    }

    public float getWidth() {
        return width;
    }

    public void setWidth(float _width) {
        width = _width;
    }

    public float getHeight() {
        return height;
    }

    public void setHeight(float _height) {
        height = _height;
    }

    public float getMaxWidth() {
        return maxWidth;
    }

    public void setMaxWidth(float _maxWidth) {
        maxWidth = _maxWidth;
    }

    public float getMaxHeight() {
        return maxHeight;
    }

    public void setMaxHeight(float _maxHeight) {
        maxHeight = _maxHeight;
    }

    public float getViewX() {
        return viewX;
    }
    public void setViewX(float _viewX) {
        viewX = _viewX;
    }

    public float getViewY() {
        return viewY;
    }

    public void changeViewY(float _amt) {
        if(viewY + _amt <= maxHeight && viewY + _amt >= 0) viewY += _amt;
    }

    public void setViewY(float _viewY) {
        viewY = _viewY;
    }
}
