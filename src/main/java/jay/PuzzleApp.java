package jay;

import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.animation.TranslateTransition;
import javafx.application.Application;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Region;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;
import javafx.stage.Stage;
import javafx.util.Duration;

// Math Puzzle (Sliding Puzzle) με JavaFX
public class PuzzleApp extends Application {

    private static final double TILE_SIZE = 80;
    private static final double GAP = 6;
    private static final String STYLE_TILE =
            "-fx-background-color: #3b82f6; -fx-text-fill: white; -fx-background-radius: 10;";
    private static final String STYLE_TILE_HOVER =
            "-fx-background-color: #2563eb; -fx-text-fill: white; -fx-background-radius: 10;";
    private static final String STYLE_EMPTY =
            "-fx-background-color: #1f2937; -fx-background-radius: 10;";

    private PuzzleModel model;
    private final Button[][] buttons = new Button[4][4];
    private final GridPane grid = new GridPane();
    private final Label movesLabel = new Label();
    private final Label timeLabel = new Label();
    private final Label messageLabel = new Label();
    private final ComboBox<String> sizeBox = new ComboBox<>();

    private Timeline clock;
    private int seconds;
    private boolean clockStarted;
    private boolean animating;
    private boolean gameOver;

    @Override
    public void start(Stage stage) {
        buildClock();
        model = new PuzzleModel(3);

        VBox root = new VBox(14, buildTopBar(), buildButtonBar(), buildGridHolder(), messageLabel);
        root.setAlignment(Pos.CENTER);
        root.setPadding(new Insets(20));
        root.setStyle("-fx-background-color: #f3f4f6;");

        messageLabel.setFont(Font.font("System", FontWeight.BOLD, 18));
        messageLabel.setStyle("-fx-text-fill: #15803d;");
        messageLabel.setMinHeight(28);

        newGame();

        stage.setTitle("Math Puzzle");
        stage.setScene(new Scene(root, 600, 540));
        stage.setMinWidth(600);
        stage.setMinHeight(540);
        stage.show();
    }

    // ---------------------------------------------------------------- UI

    private HBox buildTopBar() {
        HBox bar = new HBox(40, movesLabel, timeLabel);
        bar.setAlignment(Pos.CENTER);
        movesLabel.setMinWidth(Region.USE_PREF_SIZE);
        timeLabel.setMinWidth(Region.USE_PREF_SIZE);
        movesLabel.setFont(Font.font("System", FontWeight.BOLD, 16));
        timeLabel.setFont(Font.font("System", FontWeight.BOLD, 16));
        return bar;
    }

    private HBox buildButtonBar() {
        sizeBox.getItems().addAll("3×3 (8 Puzzle)", "4×4 (15 Puzzle)");
        sizeBox.getSelectionModel().select(0);
        sizeBox.setOnAction(e -> {
            int size = sizeBox.getSelectionModel().getSelectedIndex() == 0 ? 3 : 4;
            model = new PuzzleModel(size);
            newGame();
        });

        Button shuffleButton = new Button("Νέο Παιχνίδι / Shuffle");
        shuffleButton.setOnAction(e -> newGame());

        HBox bar = new HBox(16, sizeBox, shuffleButton);
        bar.setAlignment(Pos.CENTER);
        return bar;
    }

    private StackPane buildGridHolder() {
        grid.setHgap(GAP);
        grid.setVgap(GAP);
        grid.setAlignment(Pos.CENTER);
        return new StackPane(grid);
    }

    // φτιάχνει τα κουμπιά
    private void buildTiles() {
        grid.getChildren().clear();
        int n = model.getSize();
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                Button b = new Button();
                b.setMinSize(TILE_SIZE, TILE_SIZE);
                b.setMaxSize(TILE_SIZE, TILE_SIZE);
                b.setPrefSize(TILE_SIZE, TILE_SIZE);
                b.setFont(Font.font("System", FontWeight.BOLD, 28));
                final int row = r;
                final int col = c;
                b.setOnAction(e -> onTileClicked(row, col));
                buttons[r][c] = b;
                grid.add(b, c, r);
            }
        }
    }

    // ενημερώνει τα κουμπιά από τον πίνακα
    private void refreshTiles() {
        int n = model.getSize();
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                Button b = buttons[r][c];
                int value = model.get(r, c);
                b.setTranslateX(0);
                b.setTranslateY(0);
                if (value == 0) {
                    b.setText("");
                    b.setStyle(STYLE_EMPTY);
                    b.setDisable(true);
                    b.setOpacity(1);
                    b.setOnMouseEntered(null);
                    b.setOnMouseExited(null);
                } else {
                    b.setText(String.valueOf(value));
                    b.setStyle(STYLE_TILE);
                    b.setDisable(false);
                    b.setOnMouseEntered(e -> b.setStyle(STYLE_TILE_HOVER));
                    b.setOnMouseExited(e -> b.setStyle(STYLE_TILE));
                }
            }
        }
        movesLabel.setText("Κινήσεις: " + model.getMoves());
        timeLabel.setText("Χρόνος: " + seconds + " δ");
    }

    // ------------------------------------------------------- Game logic

    private void newGame() {
        stopClock();
        seconds = 0;
        clockStarted = false;
        gameOver = false;
        animating = false;
        messageLabel.setText("");
        model.shuffle();
        buildTiles();
        refreshTiles();
    }

    // όταν πατιέται ένα πλακίδιο
    private void onTileClicked(int row, int col) {
        if (gameOver || animating || !model.canMove(row, col)) {
            return;
        }
        int[] empty = model.emptyPosition();
        Button tile = buttons[row][col];

        animating = true;
        TranslateTransition tt = new TranslateTransition(Duration.millis(140), tile);
        tt.setByX((empty[1] - col) * (TILE_SIZE + GAP));
        tt.setByY((empty[0] - row) * (TILE_SIZE + GAP));
        tt.setOnFinished(e -> {
            model.move(row, col);
            refreshTiles();
            animating = false;
            checkWin();
        });
        startClockIfNeeded();
        tt.play();
    }

    private void checkWin() {
        if (model.isSolved()) {
            gameOver = true;
            stopClock();
            messageLabel.setText("Συγχαρητήρια! Το παζλ λύθηκε σε "
                    + model.getMoves() + " κινήσεις!");
            int n = model.getSize();
            for (int r = 0; r < n; r++) {
                for (int c = 0; c < n; c++) {
                    buttons[r][c].setDisable(true);
                    if (model.get(r, c) != 0) {
                        buttons[r][c].setStyle(
                                "-fx-background-color: #16a34a; -fx-text-fill: white;"
                                        + " -fx-background-radius: 10; -fx-opacity: 1;");
                    }
                }
            }
        }
    }

    // ------------------------------------------------------------ Clock

    private void buildClock() {
        clock = new Timeline(new KeyFrame(Duration.seconds(1), e -> {
            seconds++;
            timeLabel.setText("Χρόνος: " + seconds + " δ");
        }));
        clock.setCycleCount(Timeline.INDEFINITE);
    }

    private void startClockIfNeeded() {
        if (!clockStarted) {
            clockStarted = true;
            clock.play();
        }
    }

    private void stopClock() {
        clock.stop();
    }

    public static void main(String[] args) {
        launch(args);
    }
}
