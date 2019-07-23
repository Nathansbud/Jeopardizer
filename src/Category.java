import java.util.ArrayList;
import processing.core.PApplet;

public class Category {
    private static PApplet gui;
    private String name;
    private String dialogue = "";
    private String date = "";

    private ArrayList<Question> questions = new ArrayList<Question>();

    private float x, y = 0;
    private float width, height;

    public Category() {

    }

    public void draw() {
        if(gui.args[0].equals("Game")) {
            if(Game.getCategoryFont() != null) {
                gui.textFont(Game.getCategoryFont());
            }
            gui.fill(PApplet.unhex(JConstants.JEOPARDY_BLUE));
            gui.rect(x, y, Question.getWidth(), Question.getHeight());
            gui.fill(255);
            gui.textSize(18);
            gui.text(name.trim(), x + 0.1f * Question.getWidth(), y + Question.getHeight() / 3.0f, Question.getWidth() * 0.9f, Question.getHeight());
            for (Question q : questions) {
                q.draw();
            }
        }
    }

    public void setValues(Round.RoundType r) {
        for(int i = 0; i < questions.size(); i++) {
            switch(r) {
                case SINGLE:
                    questions.get(i).setValue(200+200*i);
                    break;
                case DOUBLE:
                    questions.get(i).setValue(400+400*i);
                    break;
                case FINAL:
                    questions.get(i).setValue(0);
                    break;
            }
        }
    }

    public void setX(float _x) {
        x = _x;
        for(Question q : questions) {
            q.setX(x);
        }
    }

    public void setY(float _y) {
        y = _y;
        for(int i = 1; i < questions.size()+1; i++) {
            questions.get(i-1).setY(i*Question.getHeight()+(i)*Question.getHeightBuffer());
        }
    }

    public void setWidth(float _width) {
        width = _width;
    }

    public void setHeight(float _height) {
        height = _height;
    }

    public ArrayList<Question> getQuestions() {
        return questions;
    }
    public void setQuestions(ArrayList<Question> _questions) {
        questions = _questions;
    }

    public Question getQuestion(int index) {
        return questions.get(index);
    }
    public void addQuestion(Question q) {
        q.setCategory(name);
        questions.add(q);
    }

    public String getName() {
        return name;
    }
    public void setName(String _name) {
        name = _name;
    }

    public String getDialogue() {
        return dialogue;
    }
    public boolean hasDialogue() {
        return !dialogue.equals("");
    }
    public void setDialogue(String _dialogue) {
        dialogue = _dialogue;
    }

    public void setDate(String _date) {
        date = _date;
        for(Question q : questions) {
            q.setDate(_date);
        }
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


    public static void setGui(PApplet _gui) {
        gui = _gui;
    }
}

