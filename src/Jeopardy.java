import processing.core.PApplet;

import org.json.simple.*;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

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

    private static Pattern alexDialogue = Pattern.compile("(?<=\\(Alex: )(?s)(.*)(?=\\))");


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
        Round.getCurrentRound().draw();
    }


    private static boolean containsDialogue(String s) {
        return s.contains("(") || s.contains(")");
    }

    private static String removeAlexDialogue(String s) {
        System.out.println("Comment:" + s.substring(s.indexOf("("), s.indexOf(")")+1));
        return s.substring(0, s.indexOf("(")-1) + s.substring(s.lastIndexOf(")")+((s.lastIndexOf(")")!=s.length()-1)?(1):(0)), s.length() - 1);
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

    public static void main(String[] args) {
        String s = "Owowowow (Alex: Suck me off pls)";

        setCategories();
        for(Category c : first.getCategories()) {
            System.out.println(c.getName());
        }
        System.out.println(second.getCategories());
        System.out.println(third.getCategories());

        Round.setCurrentRound(second);
        PApplet.runSketch(new String[]{"Jeopardy"}, app);
    }
}
