public class Media {
    public enum MediaType {
        AUDIO(), //Extends minim
        VIDEO(), //Extends PVideo
        IMAGE() //Extends PImage
    }

    private MediaType type;
    private String name;
    private String path;

    private Object media;

    public Media(MediaType _type, String _path) {
        type = _type;
        path = _path;
    }

    public Media() {

    }

    public void load() {
        switch(type) {
            case AUDIO:
                media = Game.getMinim().loadFile(path);
                break;
            case VIDEO:
                break;
            case IMAGE:
                media = Game.getGUI().loadImage(path);
                break;
            default:
                break;
        }
    }

    public void load(String _path) {
        path = _path;
        load();
    }

    public Object getMedia() {
        return media;
    }
    public void setMedia(Object _media) {
        media = _media;
    }

    public MediaType getType() {
        return type;
    }
    public void setType(MediaType _type) {
        type = _type;
    }

    public String getName() {
        return name;
    }
    public void setName(String _name) {
        name = _name;
    }

    public String getPath() {
        return path;
    }
    public void setPath(String _path) {
        path = _path;
    }
}
