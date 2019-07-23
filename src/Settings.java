public class Settings {
    private String textColor;
    private String backgroundColor;
    private String fontColor;
    private int playerCount;

    private boolean sfx;
    private boolean customFonts;

    public String getTextColor() {
        return textColor;
    }

    public void setTextColor(String _textColor) {
        textColor = _textColor;
    }

    public String getBackgroundColor() {
        return backgroundColor;
    }

    public void setBackgroundColor(String _backgroundColor) {
        backgroundColor = _backgroundColor;
    }

    public String getFontColor() {
        return fontColor;
    }

    public void setFontColor(String _fontColor) {
        fontColor = _fontColor;
    }

    public int getPlayerCount() {
        return playerCount;
    }

    public void setPlayerCount(int _playerCount) {
        playerCount = _playerCount;
    }

    public boolean isSfx() {
        return sfx;
    }

    public void setSfx(boolean _sfx) {
        sfx = _sfx;
    }
}
