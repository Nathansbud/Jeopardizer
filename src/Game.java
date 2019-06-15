import processing.core.PApplet;
import processing.core.PImage;
import processing.event.KeyEvent;
import processing.core.PFont;

import org.json.simple.*;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import ddf.minim.*;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.Queue;
import java.util.Iterator;
import java.util.Collections;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.ThreadLocalRandom;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;

public class Game extends PApplet {
    private static Game app = new Game();
    private static Console console = new Console();

    private static PFont qfont = null; //Korinna
    private static PFont cfont = null; //Helvetica Inserat
    private static PFont mfont = null; //Swiss 911

    private static Round first = new Round(Round.RoundType.SINGLE);
    private static Round second = new Round(Round.RoundType.DOUBLE);
    private static Round third = new Round(Round.RoundType.FINAL);

    private static ArrayList<Round> customRounds = new ArrayList<>(); //To be used for custom rounds
    private static Queue<Round> progressionPath = new LinkedList<>(); //Used to set path of rounds; 1st->2nd-3rd is classic, but opens up to new possibilities

    private static ArrayList<Player> players = new ArrayList<Player>();
    private static String[] playerNames = {
            "Aneekha", "Dev", "Zack"
    };

    private static Timer timer = new Timer();
    private static boolean timerState = false;

    private static Minim minim;
    public static AudioPlayer tracks[] = new AudioPlayer[4];

    private static String wager = "";
    private static int filterYear = 2008;
    private static int upperFilterYear = 2019;

    private static boolean isCustom = false;
    private static boolean isScraped = true;

    @Override
    public void settings() {
        fullScreen(1);
    }

    @Override
    public void setup() {
        minim = new Minim(app);

        Question.setConstants(app);
        Category.setGui(app);


        if(!isCustom) {
            first.setup();
            second.setup();
        } else {
            first.setup();
        }


        tracks[0] = minim.loadFile("data" + File.separator + "audio" + File.separator + "Time Out.mp3");
        tracks[1] = minim.loadFile("data" + File.separator + "audio" + File.separator + "Daily Double.mp3");
        tracks[2] = minim.loadFile("data" + File.separator + "audio" + File.separator + "Final Jeopardy.mp3");
        tracks[3] = minim.loadFile("data" + File.separator + "audio" + File.separator + "Question Open.mp3");

        for(Round r : progressionPath) {
            for(Category c : r.getCategories()) {
                for(Question q : c.getQuestions()) {
                    if(q.hasMedia()) {
                        q.getMedia().load();
                    }
                }
            }
        }

        Round.setCurrentRound(progressionPath.poll());
        String pathToFont = "data" + File.separator + "fonts";
        for(File f : new File(pathToFont).listFiles()) {
            String fontName = f.getName().substring(0, f.getName().indexOf("."));
            switch(fontName) {
                case "Question":
                    qfont = createFont(f.getAbsolutePath(), 12, true);
                    break;
                case "Category":
                    cfont = createFont(f.getAbsolutePath(), 12, true);
                    break;
                case "Values":
                    mfont = createFont(f.getAbsolutePath(), 12, true);
                    break;
            }
        }
    }

    @Override
    public void draw() {
        background(0);
        if(Round.getGameState() != Round.GameState.SCORES) {
            Round.getCurrentRound().draw();
        } else {
            background(PApplet.unhex(JConstants.JEOPARDY_BLUE));
            fill(255);

            textFont(cfont);
            textSize(60);
            for(int i = 0; i < players.size(); i++) {
                text(players.get(i).getName() + ": $" + String.valueOf(players.get(i).getScore()), width/3.0f, height/5.0f*(i+1));
            }
        }
    }

    @Override
    public void mouseClicked() {
        if(Round.getGameState() != Round.GameState.SCORES) {
            if (Question.getSelected() == null) {
                for (Category c : Round.getCurrentRound().getCategories()) {
                    for (Question q : c.getQuestions()) {
                        if (mouseX > q.getX() && mouseX < (q.getX() + Question.getWidth()) && mouseY > q.getY() && mouseY < q.getY() + Question.getHeight() && !q.isAnswered()) {
                            if(q.isDailyDouble()) {
                                tracks[1].play();
                            }
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
    public void keyPressed(KeyEvent event) {
//        System.out.println(event.getKeyCode());
        if(event.getKeyCode() == 192 && Round.getCurrentRound().getRoundType() == Round.RoundType.FINAL) {
            tracks[2].play();
        }
        if(Round.getCurrentRound().getRoundType() != Round.RoundType.FINAL && Question.getSelected() == null) { //Question select screen
            ArrayList<Category> c = Round.getCurrentRound().getCategories();
            Question q = null;
            switch (event.getKeyCode()) { //To-do: make this less hardcoded for custom categories
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
                if(q.isDailyDouble()) {
                    tracks[1].play();
                }
                Round.setGameState(Round.GameState.QUESTION);
            }
        } else if(Question.getSelected() != null) {  //Only on during question up
            switch(event.getKeyCode()) {
                case 8: //DELETE, HANDLE INCORRECT RESPONSE
                    if(Player.getActive() != null) {
                        Player.getActive().changeScore(-Question.getSelected().getValue());
                        System.out.println(Player.getActive().getScore());
                    }
                    wager = "";
                    break;
                case 9: //TAB
                    if(Question.getSelected().hasMedia()) {
                        if(Question.getSelected().getMedia().getType() == Media.MediaType.AUDIO) {
                            ((AudioPlayer)Question.getSelected().getMedia().getMedia()).pause();
                        }
                    }
                    Question.setSelected(null);
                    Round.setGameState(Round.GameState.ROUND);
                    wager = "";
                    if(timerState) {
                        System.out.println("Timer cancelled, question closed");
                        timer.cancel();
                        timerState = false;
                        timer = new Timer();
                    }
                    for(AudioPlayer t : tracks) {
                        t.pause();
                        t.rewind();
                    }
                    break;
                case 10: //ENTER
                    if(Question.getSelected().hasMedia()) {
                        if(Question.getSelected().getMedia().getType() == Media.MediaType.AUDIO) {
                            ((AudioPlayer)Question.getSelected().getMedia().getMedia()).pause();
                        }
                    }

                    if(Player.getActive() != null) {
                        Player.getActive().changeScore(Question.getSelected().getValue());
                        System.out.println(Player.getActive().getName() + ": " + Player.getActive().getScore());
                    }
                    if(Round.getCurrentRound().getRoundType() != Round.RoundType.FINAL) {
                        Question.setSelected(null);
                        Round.setGameState(Round.GameState.ROUND);
                    }
                    wager = "";

                    if(timerState) {
                        timer.cancel();
                        timerState = false;
                        timer = new Timer();
                    }

                    for(AudioPlayer t : tracks) {
                        t.pause();
                        t.rewind();
                    }
                    break;
                case 17: //Control
                    timerState = !timerState;
                    if(tracks[0].position() > 0) {
                        tracks[0].pause();
                        tracks[0].rewind();

                    }
                    if(timerState) {
                        System.out.println("Timer started");
                        timer.schedule(new TimerTask() {
                            @Override
                            public void run() {
                                System.out.println("Timer called");
                                tracks[0].play();
                                timerState = false;
                                timer = new Timer();
                            }
                        }, 5000);
                    } else {
                        System.out.println("Timer stopped");
                        timer.cancel();
                        timerState = false;
                        timer = new Timer();

                    }
                    break;
                case 18: //Option
                    if(Question.getSelected().hasMedia()) {
                        Question.getSelected().setShowMedia(!Question.getSelected().isShowMedia());
                    }
                    break;
                case 61:
                    if(Question.getSelected().isWagerable()) {
                        if(wager.length() == 0) {
                            Question.getSelected().setValue(0);
                        } else {
                            try {
                                Question.getSelected().setValue(Integer.valueOf(wager));
                                Question.getSelected().setShowQuestion(true);
                            } catch(NumberFormatException e) {
                                System.out.println("Failed to set value of wager due to string error");
                            }
                        }
                    }
                    break;
                case 192:
                    if(Round.getCurrentRound().getRoundType() != Round.RoundType.FINAL) {
                        if(tracks[0].position() > 0) {
                            tracks[0].pause();
                            tracks[0].rewind();
                        }
                        tracks[0].play();
                    }
                    break;
            }
        } else {
            switch(event.getKeyCode()) {
                case 16:
                    if (Round.getGameState() != Round.GameState.QUESTION) {
                        Round.setGameState(Round.GameState.SCORES);
                    } else {
                        Round.setGameState(Round.GameState.ROUND);
                    }
                    break;
                case 192:
                    tracks[2].play();
                    break;
                default:
                    Question finalQ = Round.getCurrentRound().getCategories().get(0).getQuestions().get(0);
                    finalQ.setAnswered(true);
                    Question.setSelected(finalQ);
                    break;
            }
        }

        switch(event.getKeyCode()) { //Always On
            case 45:
                if(wager.length() > 0) {
                    wager = wager.substring(0, wager.length() - 1);
                    System.out.println(wager);
                }
                break;
            case 61: //=
                if(Question.getSelected() == null) {
                    try {
                        Player.getActive().changeScore(Integer.valueOf(wager));
                    } catch(NumberFormatException e) {
                        System.out.println("Wager add failed!");
                    }
                }
                wager = "";
                break;
            case 48:
            case 49:
            case 50:
            case 51:
            case 52:
            case 53:
            case 54:
            case 55:
            case 56:
            case 57:
                wager += (event.getKey());
                System.out.println(wager);
                break;
            case 157: //Option
                break;
            case 44: //<
                break;
            case 46: //]
                break;
            case 47: //\
                break;
            case 37: //Left arrow key (mac)
                int leftShift = players.indexOf(Player.getActive())-1;
                if(leftShift > -1) {
                    Player.setActive(players.get(leftShift));
                }
                break;
            case 39: //Right arrow key (mac)
                int rightShift = players.indexOf(Player.getActive())+1;
                if(rightShift < players.size()) {
                    Player.setActive(players.get(rightShift));
                }
                break;
            default:
                break;
        }
    }

    private static void progressRound() {
        if(progressionPath.peek() != null) {
            Round.setCurrentRound(progressionPath.poll());
        } else {
            tracks[2].play();
        }
    }

    public static ArrayList<Player> getPlayers() {
        return players;
    }
    public static String getWager() {
        return wager;
    }
    public static boolean getTimerState() {
        return timerState;
    }
    public static PApplet getGUI() {
        return app;
    }
    public static Minim getMinim() {
        return minim;
    }
    public static PFont getQuestionFont() {
        return qfont;
    }
    public static PFont getCategoryFont() {
        return cfont;
    }
    public static PFont getMoneyFont() {
        return mfont;
    }

    private static boolean containsDialogue(String s) {
        return s.contains("(") || s.contains(")");
    }

    private static String removeAlexDialogue(String s) {
        return s.substring(0, s.indexOf("(")) + s.substring(s.lastIndexOf(")")+((s.lastIndexOf(")")!=s.length()-1)?(1):(0)), s.length() - 1);
    }

    public static String getDialogue(String s) {
        String n = s.substring(s.indexOf("("), s.indexOf(")")+1);
        System.out.println("Dialogue for " + removeAlexDialogue(s).trim() + ": " + n);
        return s.substring(s.indexOf("("), s.indexOf(")")+1);
    }

    private static void loadCategories(Round r, String filePath, int categoryCount, int categoryQuestionCount) { //Should refactor this to be recursive
        JSONParser jsonParser = new JSONParser();

        try {
            FileReader f = new FileReader(filePath);
            JSONArray categories = (JSONArray) jsonParser.parse(f);
            f.close();
            ArrayList<Integer> choices = new ArrayList<>();

            while (r.getCategories().size() < categoryCount) {
                int rand = ThreadLocalRandom.current().nextInt(0, categories.size());

                if (!choices.contains(rand)) {
                    choices.add(rand);
                    JSONObject cat = (JSONObject) categories.get(rand);
                    Iterator keys = cat.keySet().iterator();
                    Iterator values = cat.values().iterator();

                    Category c = new Category();

                    boolean continueAdd = true;

                    while(keys.hasNext() && values.hasNext() && continueAdd) {
                        switch ((String) keys.next()) {
                            case "Category":
                                String catName = (String)values.next();
                                if(containsDialogue(catName)) {
                                    c.setName(removeAlexDialogue(catName));
                                    c.setDialogue(catName);
                                } else {
                                    c.setName(catName);
                                }
                                break;
                            case "Clues":
                                for (Object obj : (JSONArray) values.next()) {
                                    JSONObject clue = (JSONObject) obj;

                                    Iterator k = clue.keySet().iterator();
                                    Iterator v = clue.values().iterator();
                                    Question q = new Question();

                                    while (k.hasNext() && v.hasNext()) {
                                        switch ((String) k.next()) {
                                            case "Answer":
                                                String aAdd = ((String) v.next()).trim();
                                                if (!aAdd.equals("") && !aAdd.equals("\u00a0") && !aAdd.equals("=")) { //Null check, shouldn't take place to begin with as I don't believe any null cats exist
                                                    q.setAnswer(aAdd);
                                                } else {
                                                    c.setQuestions(null);
                                                    continueAdd = false;
                                                }
                                                break;
                                            case "Question":
                                                String qAdd = ((String) v.next()).trim();
                                                if (!qAdd.equals("") && !qAdd.equals("\u00a0") && !qAdd.equals("=")) { //Null check, shouldn't take place to begin with as don't think any null cats exist
                                                    q.setQuestion(qAdd);
                                                } else {
                                                    c.setQuestions(null);
                                                    continueAdd = false;
                                                }
                                                break;
                                            case "Media":
                                                Media m = new Media();
                                                JSONObject mediaObj = (JSONObject)v.next();
                                                Iterator mK = mediaObj.keySet().iterator();
                                                Iterator mV = mediaObj.values().iterator();
                                                while(mK.hasNext() && mV.hasNext()) {
                                                    switch((String) mK.next()) {
                                                        case "Type":
                                                            m.setType(Media.MediaType.valueOf(((String)mV.next()).toUpperCase()));
                                                            break;
                                                        case "Name":
                                                            m.setName((String)mV.next());
                                                            break;
                                                        case "Path":
                                                            m.setPath((String)mV.next());
                                                            break;
                                                    }
                                                }
                                                q.setMedia(m);
                                                break;
                                            default:
                                                break;
                                        }
                                    }
                                    if(continueAdd) {
                                        if(q.getQuestion() != null && q.getAnswer() != null) {
                                            c.addQuestion(q);
                                        } else {
                                            continueAdd = false;
                                            c.setQuestions(null);
                                            break;
                                        }
                                    } else {
                                        break;
                                    }
                                }
                                break;
                            case "Date":
                                c.setDate((String)values.next());
                                break;
                        }
                    }
                    if(c.getQuestions() != null) {
                        if(c.getYear() == -1 || (c.getYear() >= filterYear && c.getYear() <= upperFilterYear && c.getQuestions().size() == categoryQuestionCount)) {
                            r.addCategory(c);
                            for (Question cq : c.getQuestions()) {
                                if (c.hasDialogue()) {
                                    cq.setDialogue(c.getDialogue());
                                }
                            }
                        }
                    }
                }
            }
        } catch(ParseException | IOException e){
            System.out.println("Failed to exist life is hard and i don't like functions");
        }
     }

    public static void printQuestions(Round r) {
        System.out.println(r.getRoundType().toString());
        for(Category c : r.getCategories()) {
            System.out.println(c.getName());
            int count = 0;
            for(Question q : c.getQuestions()) {
                System.out.println("["+count++ +"]");
                System.out.println(q.getQuestion());
                System.out.println(q.getAnswer());
            }
        }
    }

    public static void setProgressionPath(Round... roundPath) {
        Collections.addAll(progressionPath, roundPath);
    }

    public static void scrapeGame(String url) {
        try {
            Process p = Runtime.getRuntime().exec("scripts" + File.separator + "scraper.py -s " + url);
            p.waitFor();
        } catch(IOException | InterruptedException e) {
            System.out.println("Scraper call failed!");
        }
    }
    public static void makeCustoms() {
        try {
            Process p = Runtime.getRuntime().exec("scripts" + File.separator + "customs.py");
            p.wait();
        } catch(IOException | InterruptedException e) {
            System.out.println("Failed to make customs!");
        }
    }

    public static void main(String[] args) {
        makeCustoms();
        if(!isCustom) {
            setProgressionPath(first, second, third);
            for(Round r : progressionPath) {
                r.setFilterYear(filterYear);
            }

            String append = "";
            String dir = "all";

            if(isScraped) {
                scrapeGame("http://www.j-archive.com/showgame.php?game_id=6320");
                append = "_scraped";
                dir = "scrape";
            }

            loadCategories(first, "data" + File.separator + "questions" + File.separator + dir + File.separator + "single_jeopardy" + append + ".json", 6, 5);
            loadCategories(second,"data" + File.separator + "questions" + File.separator + dir + File.separator + "double_jeopardy" + append + ".json", 6, 5);
            loadCategories(third, "data" + File.separator + "questions" + File.separator + dir + File.separator + "final_jeopardy" + append + ".json", 1, 1);

            for(Round r : progressionPath) {
                printQuestions(r);
                r.setWagerables();
            }
        } else {
            setProgressionPath(first);
            loadCategories(first, "data" + File.separator + "questions" + File.separator + "custom" + File.separator + "custom_media.json", 1, 5);
        }

        for (String p : playerNames) {
            players.add(new Player(p));
        }

        if(players.size() > 0) {
            Player.setActive(players.get(0));
        }

        app.args = new String[]{"Game"};
        console.args = new String[]{"Console"};

        PApplet.runSketch(app.args, app);
        PApplet.runSketch(console.args, new Console());
    }
}
