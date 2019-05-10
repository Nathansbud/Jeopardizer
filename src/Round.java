import java.util.ArrayList;

public class Round {
    enum RoundType {
        SINGLE(),
        DOUBLE(),
        FINAL()
    }

    private static Round CURRENT_ROUND = null;

    private RoundType round;
    private ArrayList<Category> categories = new ArrayList<Category>();

    public Round(RoundType _round) {
        round = _round;
    }

    public void setup() {
        for (int i = 0; i < categories.size(); i++) {
            categories.get(i).setX(i * Question.getWidth() + i*Question.getWidthBuffer());
            categories.get(i).setY(0);
            categories.get(i).setValues(round);
        }
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

