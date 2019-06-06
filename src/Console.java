import processing.core.PApplet;

public class Console extends PApplet {
    @Override
    public void settings() {
        fullScreen(2);
    }

    @Override
    public void draw() {
        background(PApplet.unhex(JConstants.JEOPARDY_BLUE));
        textSize(40);
        for (int i = 0; i < Game.getPlayers().size(); i++) {
            if (Game.getPlayers().get(i).isActive()) {
                fill(PApplet.unhex(JConstants.JEOPARDY_YELLOW));
            } else {
                fill(255);
            }
            text(Game.getPlayers().get(i).getName() + ": $" + String.valueOf(Game.getPlayers().get(i).getScore()), width / 10.0f + width / 5.0f * (i), height / 18.0f);
        }
        try {
            if(Question.getSelected() != null) {
                if (Question.getSelected().isWagerable()) {
                    fill(PApplet.unhex(JConstants.JEOPARDY_WAGERABLE));
                    if (Question.getSelected().isDailyDouble()) {
                        text("DAILY DOUBLE", width / 2.0f - 0.5f * textWidth("DAILY DOUBLE"), height / 10.0f);
                    } else {
                        text("FINAL JEOPARDY", width / 2.0f - 0.5f * textWidth("FINAL JEOPARDY"), height / 10.0f);
                    }

                    text(Game.getWager(), width / 2.0f - 0.5f * textWidth(Game.getWager()), height / 8.0f);
                }

                if(Game.getTimerState()) {
                    fill(PApplet.unhex(JConstants.JEOPARDY_WAGERABLE));
                } else {
                    fill(255);
                }

                text((Game.getTimerState()) ? ("(Timer Running)") : ("(Timer Stopped)"), width/2.0f - 0.5f * textWidth("(Timer Running)"), 0 + height/4.0f);
                if(Question.getSelected().hasMedia() && Question.getSelected().getMedia().getType() != Media.MediaType.AUDIO) {
                    text((Question.getSelected().isShowMedia()) ? ("(Showing Media:  ") : ("(Unshown Media: ") + Question.getSelected().getMedia().getName() + ")", width/2.0f - 0.5f * textWidth("(Unshown Media: " + Question.getSelected().getMedia().getName() + ")"),  height/4.0f + height/20.0f);
                }
                fill(255);
                if(Question.getSelected().getCategory() != null && !Question.getSelected().getCategory().equals("")) {
                    text(Question.getSelected().getCategory(), width / 2.0f - 0.5f * textWidth(Question.getSelected().getCategory()), 0 + height / 5.0f);
                }
                if(Question.getSelected().getQuestion() != null && !Question.getSelected().getQuestion().equals("")) {
                    text(Question.getSelected().getQuestion(), width / 8.0f, height / 3.0f, width - width / 3.0f, height);
                }
                if(Question.getSelected().getAnswer() != null && !Question.getSelected().getAnswer().equals("")) {
                    text(Question.getSelected().getAnswer(), width / 8.0f, height - height / 5.0f);
                }
                if(Question.getSelected().getDate() != null && !Question.getSelected().getDate().equals("")) {
                    text(Question.getSelected().getDate(), width - 2 * textWidth(Question.getSelected().getDate()), height - height / 5.0f);
                }
            } else {
                textSize(25);
                fill(255);

                int offsetDialogue = 0;
                int offsetDailyDouble = 0;

                for(int i = 0; i < Round.getCurrentRound().getCategories().size(); i++) {
                    Category c = Round.getCurrentRound().getCategory(i);
                    if(c.hasDialogue()) {
                        offsetDialogue++;
                        text(c.getDialogue().trim(), width/1.95f, height/4.0f*(offsetDialogue), width/3.0f, height);
                    }
                    for(int j = 0; j < c.getQuestions().size(); j++) {
                        if(c.getQuestions().get(j).isDailyDouble()) {
                           offsetDailyDouble++;
                           text("DD: " + c.getName() + " (" + c.getQuestions().get(j).getValue() + ")", width/144.0f, height/4.0f*offsetDailyDouble, width/2.0f, height);
                        }
                    }
                }
            }
        } catch(NullPointerException e) {
            for(Object o : e.getStackTrace()) {
                System.out.println(o);
            }
            System.out.println("Encountered NullPointerException in Console, despite null checks");
        }
    }
}
