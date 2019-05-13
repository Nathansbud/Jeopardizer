import processing.core.PApplet;
import processing.core.PConstants;

public class Question {
    private static Question selected = null;
    private static PApplet gui;

    private int value;
    private String valueText = "";

    private String question;
    private String answer;

    private String category;

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

    public static void setConstants(PApplet _gui) {
        Question.setGui(_gui);
        Question.setWidth();
        Question.setHeight();
        Question.setWidthBuffer();
        Question.setHeightBuffer();
    }

    public void draw() {
        if(isSelected(this)) {
            gui.fill(PApplet.unhex(Constants.JEOPARDY_BLUE));
            gui.rect(0, 0, gui.width, gui.height);
            gui.textSize(35);

            if(wagerable) {
                gui.fill(PApplet.unhex(Constants.JEOPARDY_WAGERABLE));
                if(!dailyDouble && wagerable) {
                    gui.text("FINAL JEOPARDY", gui.width / 2.0f - 0.5f * gui.textWidth("FINAL JEOPARDY"), 0 + gui.height / 10.0f); //Need to handle final jeopardy here
                } else {
                    gui.text("DAILY DOUBLE", gui.width/2.0f - 0.5f*gui.textWidth("DAILY DOUBLE"), 0 + gui.height/10.0f); //Need to handle final jeopardy here
                }
            }
            if(showQuestion) {
                gui.fill(PApplet.unhex(Constants.JEOPARDY_YELLOW));
                gui.text(valueText, gui.width / 2.0f - 0.5f * gui.textWidth(valueText), 0 + gui.height / 7.2f); //Need to handle final jeopardy here
            }
            gui.fill(255);
            gui.text(category, gui.width/2.0f - 0.5f*gui.textWidth(category), 0+gui.height/5.0f);
            gui.textSize(40);
            if(!dailyDouble || (showQuestion)) {
                gui.text(question, gui.width / 8.0f, gui.height / 3.0f, gui.width - gui.width / 3.0f, gui.height);
            }
        } else {
            if (!answered) {
                gui.fill(PApplet.unhex(Constants.JEOPARDY_BLUE));
                gui.rect(x, y, width, height);
                gui.fill(255);
                gui.textSize(45);
                gui.fill(PApplet.unhex(Constants.JEOPARDY_YELLOW));
                gui.text(valueText, x + width / 2.0f - 0.5f * gui.textWidth(valueText), y + height / 2.0f + 0.5f * gui.textAscent());
            } else {
                gui.fill(PApplet.unhex(Constants.JEOPARDY_BLUE));
                gui.rect(x, y, width, height);
            }
        }
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


    public int getValue() {
        return value;
    }
    public void setValue(int _value) {
        value = _value;
        valueText = "$" + String.valueOf(value);
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
