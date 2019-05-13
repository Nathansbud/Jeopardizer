public class Player {
    private String name;
    private int score;
    private static Player active = null;

    public Player(String _name) {
        name = _name;
    }

    public String getName() {
        return name;
    }
    public void setName(String _name) {
        name = _name;
    }

    public int getScore() {
        return score;
    }
    public void changeScore(int amount) {
        score += amount;
    }
    public void setScore(int _score) {
        score = _score;
    }


    public boolean isActive() {
        return active != null && active.equals(this);
    }
    public static Player getActive() {
        return active;
    }
    public static void setActive(Player _active) {
        active = _active;
    }
}
