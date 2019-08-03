import java.util.ArrayList;
import java.util.concurrent.ThreadLocalRandom;

public class Round {
    enum RoundType {
        SINGLE(),
        DOUBLE(),
        FINAL(),

        CUSTOM(),
    }

    private static Round CURRENT_ROUND = null;

    private RoundType round;
    private ArrayList<Category> categories = new ArrayList<Category>();

    private int filterYear = -1;
    private boolean filter;

    public Round(RoundType _round) {
        round = _round;
    }

    public RoundType getRoundType() {
        return round;
    }
    public void setRoundType(RoundType _round) {
        round = _round;
    }

    public void setup() {
        if(round != RoundType.FINAL) {
            for (int i = 0; i < categories.size(); i++) {
                categories.get(i).setX(i * Question.getWidth() + i * Question.getWidthBuffer());
                categories.get(i).setY(0);
                categories.get(i).setValues(round);
                for(Question q : categories.get(i).getQuestions()) {
                    if(categories.get(i).hasDialogue()) {
                        q.setDialogue(categories.get(i).getDialogue());
                    }
                }
            }
        }
    }

    public boolean hasFilter() {
        return filter;
    }
    public void setFilter(boolean _filter) {
        filter = _filter;
    }

    public int getFilterYear() {
        return filterYear;
    }
    public void setFilterYear(int _filterYear) {
        setFilter(true);
        filterYear = _filterYear;
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
            count += c.getQuestions().size();
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

    public void setWagerables() {
        int rand = ThreadLocalRandom.current().nextInt(0, 30);

        switch(round) {
            case SINGLE:
                if(this.getQuestionCount() == 30) {
                    categories.get(rand/6).getQuestions().get(rand%5).setDailyDouble(true);
                }
                break;
            case DOUBLE:
                if(this.getQuestionCount() == 30) {
                    categories.get(rand / 6).getQuestions().get(rand % 5).setDailyDouble(true);
                    int randD = ThreadLocalRandom.current().nextInt(0, 30);
                    while (randD == rand) {
                        randD = ThreadLocalRandom.current().nextInt(0, 30);
                    }
                    categories.get(randD / 6).getQuestions().get(randD % 5).setDailyDouble(true);
                }
                break;
            case FINAL:
                categories.get(0).getQuestions().get(0).setWagerable(true);
                break;
        }
    }

    public void addCategory(Category c) {
        categories.add(c);
    }

    public static void setCurrentRound(Round _currentRound) {
        CURRENT_ROUND = _currentRound;
        if(CURRENT_ROUND.getRoundType() == RoundType.FINAL) {
           CURRENT_ROUND.getCategories().get(0).getQuestions().get(0).setAnswered(true);
           Question.setSelected(CURRENT_ROUND.getCategories().get(0).getQuestions().get(0));
        }
    }
    public static Round getCurrentRound() {
        return CURRENT_ROUND;
    }
}
