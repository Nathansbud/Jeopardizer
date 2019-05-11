import processing.core.PApplet;

import org.json.simple.*;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import processing.event.KeyEvent;

import java.util.ArrayList;
import java.util.concurrent.ThreadLocalRandom;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.regex.Pattern;


public class Jeopardy extends PApplet {
    private static Jeopardy app = new Jeopardy();

    private static Round first = new Round(Round.RoundType.SINGLE);
    private static Round second = new Round(Round.RoundType.DOUBLE);
    private static Round third = new Round(Round.RoundType.FINAL);

    private static ArrayList<Player> players = new ArrayList<Player>();

    private static Pattern alexDialogue = Pattern.compile("(?<=\\(Alex: )(?s)(.*)(?=\\))");
    private static int amountAnswered = 0;

    @Override
    public void settings() {
        fullScreen();
    }

    @Override
    public void setup() {
        Question.setConstants(app);
        Category.setGui(app);
        first.setup();
        second.setup();

    }

    @Override
    public void draw() {
        background(0);
        if(Round.getGameState() != Round.GameState.SCORES) {
            Round.getCurrentRound().draw();
        } else {
            background(PApplet.unhex("ff051281"));
            textSize(35);
            for(int i = 0; i < players.size(); i++) {
                text(players.get(i).getName() + ": $" + String.valueOf(players.get(i).getScore()), width/3.0f, height/4.0f*(i+1));
            }
        }
    }

    @Override
    public void mouseClicked() {
        if(Round.getGameState() != Round.GameState.SCORES) {
            if (Question.getSelected() == null) {
                for (Category c : Round.getCurrentRound().getCategories()) {
                    for (Question q : c.getQuestions()) {
                        if (mouseX > q.getX() && mouseX < (q.getX() + Question.getWidth()) && mouseY > q.getY() && mouseY < q.getY() + Question.getHeight()) {
                            q.setAnswered(true);
                            Question.setSelected(q);
                            break;
                        }
                    }
                }
            }
        }
    }

    @Override
    public void keyPressed(KeyEvent event) { //Numpad reserved for wagering once implemented (daily double + FJ)!
        System.out.println(event.getKeyCode());
        if(Round.getCurrentRound() != third && Question.getSelected() == null) { //Question select screen
            ArrayList<Category> c = Round.getCurrentRound().getCategories();
            Question q = null;
            switch (event.getKeyCode()) {
                case 81: //q
                    q = c.get(0).getQuestions().get(0);
                    break;
                case 87: //w
                    q = c.get(1).getQuestions().get(0);
                    break;
                case 69: //e
                    q = c.get(2).getQuestions().get(0);
                    break;
                case 82: //r
                    q = c.get(3).getQuestions().get(0);
                    break;
                case 84: //t
                    q = c.get(4).getQuestions().get(0);
                    break;
                case 89: //y
                    q = c.get(5).getQuestions().get(0);
                    break;
                case 85: //u
                    q = c.get(0).getQuestions().get(1);
                    break;
                case 73: //i
                    q = c.get(1).getQuestions().get(1);
                    break;
                case 79: //o
                    q = c.get(2).getQuestions().get(1);
                    break;
                case 80: //p
                    q = c.get(3).getQuestions().get(1);
                    break;
                case 91: //[
                    q = c.get(4).getQuestions().get(1);
                    break;
                case 93: //]
                    q = c.get(5).getQuestions().get(1);
                    break;
                case 65: //a
                    q = c.get(0).getQuestions().get(2);
                    break;
                case 83: //s
                    q = c.get(1).getQuestions().get(2);
                    break;
                case 68: //d
                    q = c.get(2).getQuestions().get(2);
                    break;
                case 70: //f
                    q = c.get(3).getQuestions().get(2);
                    break;
                case 71: //g
                    q = c.get(4).getQuestions().get(2);
                    break;
                case 72: //h
                    q = c.get(5).getQuestions().get(2);
                    break;
                case 74: //j
                    q = c.get(0).getQuestions().get(3);
                    break;
                case 75: //k
                    q = c.get(1).getQuestions().get(3);
                    break;
                case 76: //l
                    q = c.get(2).getQuestions().get(3);
                    break;
                case 59: //;
                    q = c.get(3).getQuestions().get(3);
                    break;
                case 222: //'
                    q = c.get(4).getQuestions().get(3);
                    break;
                case 92: //\
                    q = c.get(5).getQuestions().get(3);
                    break;
                case 90: //z
                    q = c.get(0).getQuestions().get(4);
                    break;
                case 88: //x
                    q = c.get(1).getQuestions().get(4);
                    break;
                case 67: //c
                    q = c.get(2).getQuestions().get(4);
                    break;
                case 86: //v
                    q = c.get(3).getQuestions().get(4);
                    break;
                case 66: //b
                    q = c.get(4).getQuestions().get(4);
                    break;
                case 78: //n
                    q = c.get(5).getQuestions().get(4);
                    break;
                case 16: //LShift
                    if(Round.getGameState() != Round.GameState.SCORES) {
                        Round.setGameState(Round.GameState.SCORES);
                    } else {
                        Round.setGameState(Round.GameState.ROUND);
                    }
                    break;
                case 192:
                    Round.setGameState(Round.GameState.ROUND);
                    progressRound();
                    break;
            }
            if(q != null && !q.isAnswered()) {
                q.setAnswered(true);
                Question.setSelected(q);
                Round.setGameState(Round.GameState.QUESTION);
            }
        } else if(Question.getSelected() != null) {  //Only on during question up
            switch(event.getKeyCode()) {
                case 8: //DELETE
                    Player.getActive().changeScore(-Question.getSelected().getValue());
                    System.out.println(Player.getActive().getScore());
                    break;
                case 9: //TAB
                    Question.setSelected(null);
                    Round.setGameState(Round.GameState.ROUND);
                    break;
                case 10: //ENTER
                    Player.getActive().changeScore(Question.getSelected().getValue());
                    System.out.println(Player.getActive().getScore());
                    Question.setSelected(null);
                    Round.setGameState(Round.GameState.ROUND);
                    break;
            }
        } else {
            Question finalQ = Round.getCurrentRound().getCategories().get(0).getQuestions().get(0);
            finalQ.setAnswered(true);
            Question.setSelected(finalQ);
        }

        switch(event.getKeyCode()) { //Always On
            case 44: //<
                if(players.size() >= 1) {
                    Player.setActive(players.get(0));
                }
                System.out.println("Active Player:" + Player.getActive().getName());
                break;
            case 46: //]
                if(players.size() >= 2) {
                    Player.setActive(players.get(1));
                }
                System.out.println("Active Player:" + Player.getActive().getName());
                break;
            case 47: //\
                if(players.size() >= 3) {
                    Player.setActive(players.get(2));
                }
                System.out.println("Active Player:" + Player.getActive().getName());
                break;
            default:
                break;
        }
    }

    private static void progressRound() {
        if (Round.getCurrentRound() == first) {
            Round.setCurrentRound(second);
        } else if (Round.getCurrentRound() == second) {
            Round.setCurrentRound(third);
            Round.getCurrentRound().getCategories().get(0).getQuestions().get(0).setAnswered(true);
            Question.setSelected(Round.getCurrentRound().getCategories().get(0).getQuestions().get(0));
        }
    }

    private static boolean containsDialogue(String s) {
        return s.contains("(") || s.contains(")");
    }

    private static String removeAlexDialogue(String s) {
        return s.substring(0, s.indexOf("(")) + s.substring(s.lastIndexOf(")")+((s.lastIndexOf(")")!=s.length()-1)?(1):(0)), s.length() - 1);
    }
    public static String getDialogue(String s) {
        String n = s.substring(s.indexOf("("), s.indexOf(")")+1);
        System.out.println("Dialogue for " + removeAlexDialogue(s) + ": " + n);
        return s.substring(s.indexOf("("), s.indexOf(")")+1);
    }

    private static void jsonToQuestions(Round round, JSONArray arr) {
        for(Object category : arr) {
            JSONObject r = (JSONObject) category;
            Category cat = new Category();
            for (Object str : r.keySet()) {
                String catName = (String)str;
                if(containsDialogue(catName)) {
                    cat.setName(removeAlexDialogue(catName));
                    cat.setDialogue(getDialogue(catName));
                } else {
                    cat.setName(catName);
                }
            }

            for(Object a : r.values()) {
                JSONArray n = (JSONArray)a;
                for(Object o : n) {
                    JSONObject q = (JSONObject)o;
                    String question = "";
                    String answer = "";

                    for(Object temp : q.keySet()) {
                        question = (String)temp;
                    }
                    for(Object temp : q.values()) {
                        answer = (String)temp;
                    }
                    cat.addQuestion(new Question(question, answer));
                }
            }
            round.addCategory(cat);
        }
    }
    private static void setCategories() {
        JSONArray singleJeopardy = new JSONArray();
        JSONArray doubleJeopardy = new JSONArray();
        JSONArray finalJeopardy = new JSONArray();

        JSONParser jsonParser = new JSONParser();
        try {
            FileReader reader = new FileReader("data" + File.separator + "single_jeopardy.json");
            JSONArray sj = (JSONArray)jsonParser.parse(reader);
            reader.close();

            reader = new FileReader("data" + File.separator + "double_jeopardy.json");
            JSONArray dj = (JSONArray)jsonParser.parse(reader);
            reader.close();

            reader = new FileReader("data" + File.separator + "final_jeopardy.json");
            JSONArray fj = (JSONArray)jsonParser.parse(reader);
            reader.close();

            while(singleJeopardy.size() < 6) {
                int rand = ThreadLocalRandom.current().nextInt(0, sj.size());
                if(!singleJeopardy.contains(sj.get(rand))) {
                    singleJeopardy.add(sj.get(rand));
                }
            }
            while(doubleJeopardy.size() < 6) {
                int rand = ThreadLocalRandom.current().nextInt(0, dj.size());
                if(!doubleJeopardy.contains(dj.get(rand))) {
                    doubleJeopardy.add(dj.get(rand));
                }
            }
            finalJeopardy.add(fj.get(ThreadLocalRandom.current().nextInt(0, fj.size())));
        } catch (ParseException | IOException e) {
            e.printStackTrace();
        }

        ArrayList<String> c = new ArrayList<String>();
        jsonToQuestions(first, singleJeopardy);
        jsonToQuestions(second, doubleJeopardy);
        for(Object o : finalJeopardy) {
            JSONObject a = (JSONObject)o;
            Category cat = new Category();
            for(Object n : a.keySet()) {
                String catName = (String)n;
                if(containsDialogue(catName)) {
                    cat.setName(removeAlexDialogue(catName));
                    cat.setDialogue(getDialogue(catName));
                } else {
                    cat.setName(catName);
                }
            }
            for(Object v : a.values()) {
                JSONObject w = (JSONObject)v;
                String question = "";
                String answer = "";
                for(Object l : w.keySet()) {
                    question = (String)l;
                }
                for(Object l : w.values()) {
                    answer = (String)l;
                }
                cat.addQuestion(new Question(question, answer));
            }
            third.addCategory(cat);
        }
    }

    public static void printQuestions(Round r) {
        System.out.println(r.getRound().toString());
        for(Category c : r.getCategories()) {
            System.out.println(c.getName());
            int count = 0;
            for(Question q : c.getQuestions()) {
                System.out.println("("+count++ +")");
                System.out.println(q.getQuestion());
                System.out.println(q.getAnswer());
            }
        }
    }

    public static void main(String[] args) {
        setCategories();
        printQuestions(first);
        printQuestions(second);
        printQuestions(third);

        Round.setCurrentRound(first);
        players.add(new Player("Nina"));
        players.add(new Player("Scott"));
        players.add(new Player("Zack"));
        Player.setActive(players.get(0));

        PApplet.runSketch(new String[]{"Jeopardy"}, app);
    }
}
