import java.util.ArrayList;
import java.util.concurrent.ThreadLocalRandom;

public class Round {
    enum RoundType {
        SINGLE(),
        DOUBLE(),
        FINAL()
    }

    enum GameState {
        ROUND(),
        QUESTION(),
        SCORES()
    }

    private static Round CURRENT_ROUND = null;
    private static GameState gameState = GameState.ROUND;

    private RoundType round;
    private ArrayList<Category> categories = new ArrayList<Category>();

    public Round(RoundType _round) {
        round = _round;
    }

    public RoundType getRound() {
        return round;
    }
    public void setRound(RoundType _round) {
        round = _round;
    }

    public static GameState getGameState() {
        return gameState;
    }
    public static void setGameState(GameState _gameState) {
        gameState = _gameState;
    }

    public void setup() {
        if(round != RoundType.FINAL) {
            for (int i = 0; i < categories.size(); i++) {
                categories.get(i).setX(i * Question.getWidth() + i * Question.getWidthBuffer());
                categories.get(i).setY(0);
                categories.get(i).setValues(round);
            }
        }
    }

    public int getNumAnswered() {
        int num = 0;
        for(Category c : categories) {
            for(Question q : c.getQuestions()) {
                if(q.isAnswered()) {
                    num++;
                }
            }
        }
        return num;
    }
    public int getQuestionCount() {
        int count = 0;
        for(Category c : categories) {
            for(Question q : c.getQuestions()) {
                count++;
            }
        }
        return count;
    }

    public void draw() {
        if(Question.getSelected() == null) {
            for (Category c : categories) {
                c.draw();
            }
        } else {
            Question.getSelected().draw();
        }
    }

    public ArrayList<Category> getCategories() {
        return categories;
    }
    public Category getCategory(int index) {
        return categories.get(index);
    }



    public void setDailyDouble() {
        int rand = ThreadLocalRandom.current().nextInt(0, 30);

        switch(round) {
            case SINGLE:
                categories.get(rand/6).getQuestions().get(rand%5).setDailyDouble(true);
                break;
            case DOUBLE:
                categories.get(rand/6).getQuestions().get(rand%5).setDailyDouble(true);
                int randD = ThreadLocalRandom.current().nextInt(0, 30);
                while(randD == rand) {
                    randD = ThreadLocalRandom.current().nextInt(0, 30);
                }
                categories.get(randD/6).getQuestions().get(randD%5).setDailyDouble(true);
                break;
            case FINAL:
                break;
        }
    }

    public void addCategory(Category c) {
        categories.add(c);
    }

    public static void setCurrentRound(Round _currentRound) {
        CURRENT_ROUND = _currentRound;
    }
    public static Round getCurrentRound() {
        return CURRENT_ROUND;
    }


}

