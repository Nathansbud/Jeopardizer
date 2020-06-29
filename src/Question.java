import processing.core.PApplet;
import processing.core.PImage;
import ddf.minim.AudioPlayer;

public class Question {
    private static Question selected = null;
    private static PApplet gui;

    private int value;
    private String valueText = "";

    private Media media = null;
    private boolean showMedia = false;

    private String question;
    private String answer;
    private String dialogue;

    private String category;
    private String date;

    private boolean answered = false;
    private boolean dailyDouble = false;
    private boolean wagerable = false;
    private boolean showQuestion = true;

    private static float width, height;
    private static float widthBuffer, heightBuffer;

    private float x, y;

    public Question(String _question, String _answer) {
        question = _question;
        answer = _answer;
    }

    public Question(String _question, String _answer, int _value, Media _media) {
        question = _question;
        answer = _answer;
        value = _value;
        media = _media;
    }

    public Question() {

    }

    public static void setConstants(PApplet _gui) {
        Question.setGui(_gui);
        Question.setWidth();
        Question.setHeight();
        Question.setWidthBuffer();
        Question.setHeightBuffer();
    }

    public void draw() {
        if(isSelected(this)) {
            if(!showMedia) {
                gui.fill(PApplet.unhex(JConstants.JEOPARDY_BLUE));
                gui.rect(0, 0, gui.width, gui.height);

                if (Game.getCategoryFont() != null && Game.isUseCustomFonts()) {
                    gui.textFont(Game.getCategoryFont());
                }
                gui.textSize(35);

                if (wagerable) {
                    gui.fill(PApplet.unhex(JConstants.JEOPARDY_WAGERABLE));
                    if (!dailyDouble && wagerable) {
                        gui.text("FINAL JEOPARDY", gui.width / 2.0f - 0.5f * gui.textWidth("FINAL JEOPARDY"), 0 + gui.height / 10.0f); //Need to handle final jeopardy here
                    } else {
                        gui.text("DAILY DOUBLE", gui.width / 2.0f - 0.5f * gui.textWidth("DAILY DOUBLE"), 0 + gui.height / 10.0f); //Need to handle final jeopardy here
                    }
                }
                if (showQuestion) {
                    gui.fill(PApplet.unhex(JConstants.JEOPARDY_YELLOW));
                    gui.text(valueText, gui.width / 2.0f - 0.5f * gui.textWidth(valueText), 0 + gui.height / 6.92f); //Need to handle final jeopardy here
                }
                gui.fill(255);
                if(category != null) {
                    gui.text(category, gui.width / 2.0f - 0.5f * gui.textWidth(category), 0 + gui.height / 5.0f);
                }
                if (Game.getQuestionFont() != null && Game.isUseCustomFonts()) {
                    gui.textFont(Game.getQuestionFont());
                    gui.textSize(60);
                } else {
                    gui.textSize(40);
                }
                if(showQuestion) {
                    gui.text(question.toUpperCase(), gui.width / 8.0f, gui.height / 3.0f, gui.width - gui.width / 3.0f, gui.height);
                }
            } else {
                switch(media.getType()) {
                    case IMAGE:
                        gui.image((PImage)media.getMedia(), 0, 0, gui.width, gui.height);
                        break;
                    case VIDEO:
                        break;
                    case AUDIO:
                        AudioPlayer m = (AudioPlayer)media.getMedia();
                        if(m.isPlaying()) {
                            m.pause();
                            m.rewind();
                        } else {
                            m.play();
                        }
                        showMedia = false;
                        break;
                }
            }
        } else {
            if (!answered) {
                if(Game.getMoneyFont() != null && Game.isUseCustomFonts()) {
                    gui.textFont(Game.getMoneyFont());
                    gui.textSize(60);
                } else {
                    gui.textSize(45);
                }

                gui.fill(PApplet.unhex(JConstants.JEOPARDY_BLUE));
                gui.rect(x, y, width, height);
                gui.fill(255);
                gui.fill(PApplet.unhex(JConstants.JEOPARDY_YELLOW));
                gui.text(valueText, x + width / 2.0f - 0.5f * gui.textWidth(valueText), y + height / 2.0f + 0.5f * gui.textAscent());
            } else {
                gui.fill(PApplet.unhex(JConstants.JEOPARDY_BLUE));
                gui.rect(x, y, width, height);
            }
        }
    }

    public Media getMedia() {
        return media;
    }
    public boolean hasMedia() {
        return media != null;
    }
    public void setMedia(Media _media) {
        media = _media;
    }

    public boolean isShowMedia() {
        return showMedia;
    }
    public void setShowMedia(boolean _showMedia) {
        showMedia = _showMedia;
    }

    public boolean isAnswered() {
        return answered;
    }
    public void setAnswered(boolean _answered) {
        answered = _answered;
    }

    public String getAnswer() {
        return answer;
    }
    public void setAnswer(String _answer) {
        answer = _answer;
    }

    public String getQuestion() {
        return question;
    }
    public void setQuestion(String _question) {
        question = _question;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String _category) {
        category = _category;
    }

    public boolean isWagerable() {
        return wagerable || dailyDouble;
    }
    public void setWagerable(boolean _wagerable) {
        wagerable = _wagerable;
        showQuestion = false;
        value = 0;
    }

    public boolean isDailyDouble() {
        return dailyDouble;
    }
    public void setDailyDouble(boolean _dailyDouble) {
        dailyDouble = _dailyDouble;
        wagerable = _dailyDouble;
        showQuestion = !_dailyDouble;
        value = 0;
    }

    public boolean isShowQuestion() {
        return showQuestion;
    }
    public void setShowQuestion(boolean _showQuestion) {
        showQuestion = _showQuestion;
    }


    public String getDialogue() {
        return dialogue;
    }
    public void setDialogue(String _dialogue) {
        dialogue = _dialogue;
    }

    public int getValue() {
        return value;
    }
    public void setValue(int _value) {
        value = _value;
        valueText = "$" + String.valueOf(value);
    }

    public String getDate() {
        return date;
    }
    public int getDay() {
        return date.length() > 0 ? Integer.parseInt(date.substring(date.indexOf("/")+1, date.lastIndexOf("/"))) : -1;
    }
    public int getMonth() {
        return date.length() > 0 ? Integer.parseInt(date.substring(0, date.indexOf("/"))) : -1;
    }
    public int getYear() {
        return date.length() > 0 ? Integer.parseInt(date.substring(date.lastIndexOf("/")+1)) : -1;
    }
    public String getMonthName() {
        return date.length() > 0 ? JConstants.MONTHS[getMonth()-1] : "";
    }
    public void setDate(String _date) {
        date = _date;
    }

    public static PApplet getGui() {
        return gui;
    }
    public static void setGui(PApplet _gui) {
        gui = _gui;
    }

    public float getX() {
        return x;
    }
    public void setX(float _x) {
        x = _x;
    }

    public float getY() {
        return y;
    }
    public void setY(float _y) {
        y = _y;
    }

    public static float getWidth() {
        return width;
    }
    public static void setWidth() {
        width = gui.width/6.125f;
    }

    public static float getHeight() {
        return height;
    }
    public static void setHeight() {
        height = gui.height/6.25f;
    }

    public static float getWidthBuffer() {
        return widthBuffer;
    }
    public static void setWidthBuffer() {
        widthBuffer = gui.width/288.0f;
    }

    public static float getHeightBuffer() {
        return heightBuffer;
    }
    public static void setHeightBuffer() {
        heightBuffer = gui.height/150.0f;
    }

    public static boolean isSelected(Question q) {
        return q.equals(selected);
    }
    public static Question getSelected() {
        return selected;
    }
    public static void setSelected(Question _selected) {
        selected = _selected;
    }
}
