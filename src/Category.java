import java.util.ArrayList;
import processing.core.PApplet;

public class Category {
    private static PApplet gui;
    private String name;
    private String dialogue = "";
    private ArrayList<Question> questions = new ArrayList<Question>();


    private float x, y = 0;
    private float width, height;

    public Category() {

    }

    public void draw() {
        gui.fill(PApplet.unhex("ff051281"));
        gui.rect(x, y, Question.getWidth(), Question.getHeight());
        gui.fill(255);
        gui.textSize(18);
        gui.text(name, x+0.1f*Question.getWidth(), y + Question.getHeight()/3.0f, Question.getWidth()*0.9f, Question.getHeight());
        for(Question q : questions) {
            q.draw();
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

    public void setDialogue(String _dialogue) {
        dialogue = _dialogue;
    }



    public static void setGui(PApplet _gui) {
        gui = _gui;
    }
}

