import processing.core.PApplet;

public class Console extends PApplet {
    @Override
    public void settings() {
        fullScreen(2);
    }

    @Override
    public void draw() {
        background(PApplet.unhex(Constants.JEOPARDY_BLUE));
        textSize(40);
        if(Question.getSelected() != null) {
            if(Question.getSelected().isWagerable()) {
                fill(PApplet.unhex(Constants.JEOPARDY_WAGERABLE));
                if(Question.getSelected().isDailyDouble()) {
                    text("DAILY DOUBLE", width / 2.0f - 0.5f * textWidth("DAILY DOUBLE"), height / 10.0f);
                } else {
                    text("FINAL JEOPARDY", width / 2.0f - 0.5f * textWidth("FINAL JEOPARDY"), height / 10.0f);
                }

                text(Game.getWager(), width / 2.0f - 0.5f*textWidth(Game.getWager()), height/8.0f);
            }

            fill(255);

            text(Question.getSelected().getCategory(), width/2.0f - 0.5f*textWidth(Question.getSelected().getCategory()), 0+height/5.0f);
            text(Question.getSelected().getQuestion(), width/8.0f, height/3.0f, width - width/3.0f, height);
            fill(PApplet.unhex(Constants.JEOPARDY_YELLOW));
            text(Question.getSelected().getAnswer(), width/8.0f, height - height/5.0f);
        }
        for(int i = 0; i < Game.getPlayers().size(); i++) {
            if(Game.getPlayers().get(i).isActive()) {
                fill(PApplet.unhex(Constants.JEOPARDY_YELLOW));
            } else {
                fill(255);
            }
            text(Game.getPlayers().get(i).getName() + ": $" + String.valueOf(Game.getPlayers().get(i).getScore()), width/5.0f + width/4.0f*i, height/10.0f);
        }
    }
}
