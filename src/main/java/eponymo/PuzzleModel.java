package eponymo;

import java.util.Random;

// Το μοντέλο του παιχνιδιού. Το 0 είναι το κενό.
public class PuzzleModel {

    private int size;
    private int[][] board;
    private int moves;
    private Random random = new Random();

    public PuzzleModel(int size) {
        this.size = size;
        board = new int[size][size];
        reset();
    }

    public int getSize() {
        return size;
    }

    public int getMoves() {
        return moves;
    }

    public int get(int row, int col) {
        return board[row][col];
    }

    // βάζει τα πλακίδια στη σωστή σειρά
    public void reset() {
        int number = 1;
        for (int i = 0; i < size; i++) {
            for (int j = 0; j < size; j++) {
                board[i][j] = number;
                number++;
            }
        }
        board[size - 1][size - 1] = 0;
        moves = 0;
    }

    // Ανακάτεμα: ξεκινάμε από τη λυμένη κατάσταση και κάνουμε πολλές
    // τυχαίες έγκυρες κινήσεις. Έτσι το παζλ είναι πάντα επιλύσιμο.
    public void shuffle() {
        reset();
        while (isSolved() || moves == 0) {
            for (int k = 0; k < 200; k++) {
                int[] empty = emptyPosition();
                int dir = random.nextInt(4);
                int r = empty[0];
                int c = empty[1];
                if (dir == 0) r--;
                if (dir == 1) r++;
                if (dir == 2) c--;
                if (dir == 3) c++;
                if (r >= 0 && r < size && c >= 0 && c < size) {
                    board[empty[0]][empty[1]] = board[r][c];
                    board[r][c] = 0;
                }
            }
            moves = 1; // για να βγει από το while αν δεν είναι λυμένο
            if (isSolved()) {
                moves = 0;
            }
        }
        moves = 0;
    }

    // βρίσκει πού είναι το κενό
    public int[] emptyPosition() {
        for (int i = 0; i < size; i++) {
            for (int j = 0; j < size; j++) {
                if (board[i][j] == 0) {
                    return new int[] {i, j};
                }
            }
        }
        return null;
    }

    // το πλακίδιο είναι δίπλα στο κενό (όχι διαγώνια);
    public boolean canMove(int row, int col) {
        int[] empty = emptyPosition();
        int diff = Math.abs(empty[0] - row) + Math.abs(empty[1] - col);
        return diff == 1;
    }

    // κάνει την κίνηση (swap με το κενό) αν επιτρέπεται
    public boolean move(int row, int col) {
        if (!canMove(row, col)) {
            return false;
        }
        int[] empty = emptyPosition();
        board[empty[0]][empty[1]] = board[row][col];
        board[row][col] = 0;
        moves++;
        return true;
    }

    // έλεγχος νίκης
    public boolean isSolved() {
        int number = 1;
        for (int i = 0; i < size; i++) {
            for (int j = 0; j < size; j++) {
                if (i == size - 1 && j == size - 1) {
                    return board[i][j] == 0;
                }
                if (board[i][j] != number) {
                    return false;
                }
                number++;
            }
        }
        return true;
    }
}
