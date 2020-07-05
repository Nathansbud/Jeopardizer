public class Player {
    private static Player active = null;
    private String name;

    private int score;
    private int wins;

    public Player(String _name) {
        name = _name;
    }
    public Player(String _name, int _wins) {
        name = _name;
        wins = _wins;
    }

    public String getName() {
        return name.split(" ")[0];
    }
    public String getFullName() {
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

    public int getWins() {
        return wins;
    }
    public void setWins(int _wins) {
        wins = _wins;
    }
}
