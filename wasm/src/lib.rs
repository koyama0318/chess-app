use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn greet() -> String {
    "hello world from wasm".to_string()
}

// --- Chess Game ---

use shakmaty::{fen::Fen, Chess, EnPassantMode, Position};

#[wasm_bindgen]
#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GameStatus {
    InProgress = 0,
    Check = 1,
    Checkmate = 2,
    Stalemate = 3,
    Draw = 4,
}

#[wasm_bindgen]
pub struct ChessGame {
    history: Vec<Chess>,
    redo_stack: Vec<Chess>,
}

impl ChessGame {
    /// Core apply_move returning Result<(), String> for testability outside wasm.
    fn apply_move_inner(&mut self, uci_move: &str) -> Result<(), String> {
        let pos = self.history.last().expect("history must never be empty");

        let uci: shakmaty::uci::UciMove = uci_move
            .parse()
            .map_err(|e: shakmaty::uci::ParseUciMoveError| {
                format!("Invalid UCI move format: {}", e)
            })?;

        let m = uci
            .to_move(pos)
            .map_err(|e| format!("Illegal move: {}", e))?;

        let new_pos = pos
            .clone()
            .play(&m)
            .map_err(|e| format!("Illegal move: {}", e))?;

        self.history.push(new_pos);
        self.redo_stack.clear();
        Ok(())
    }
}

#[wasm_bindgen]
impl ChessGame {
    #[wasm_bindgen(constructor)]
    pub fn new() -> ChessGame {
        ChessGame {
            history: vec![Chess::default()],
            redo_stack: Vec::new(),
        }
    }

    pub fn current_fen(&self) -> String {
        let pos = self.history.last().expect("history must never be empty");
        Fen::from_position(pos.clone(), EnPassantMode::Legal).to_string()
    }

    pub fn apply_move(&mut self, uci_move: &str) -> Result<(), JsValue> {
        self.apply_move_inner(uci_move)
            .map_err(|e| JsValue::from_str(&e))
    }

    pub fn undo(&mut self) -> bool {
        if self.history.len() <= 1 {
            return false;
        }
        let pos = self.history.pop().unwrap();
        self.redo_stack.push(pos);
        true
    }

    pub fn redo(&mut self) -> bool {
        match self.redo_stack.pop() {
            Some(pos) => {
                self.history.push(pos);
                true
            }
            None => false,
        }
    }

    pub fn game_status(&self) -> GameStatus {
        let pos = self.history.last().expect("history must never be empty");
        if pos.is_checkmate() {
            GameStatus::Checkmate
        } else if pos.is_stalemate() {
            GameStatus::Stalemate
        } else if pos.is_insufficient_material() {
            GameStatus::Draw
        } else if pos.is_check() {
            GameStatus::Check
        } else {
            GameStatus::InProgress
        }
    }

    pub fn can_undo(&self) -> bool {
        self.history.len() > 1
    }

    pub fn can_redo(&self) -> bool {
        !self.redo_stack.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Helper to apply moves in tests (uses inner method to avoid JsValue)
    fn apply(game: &mut ChessGame, uci: &str) {
        game.apply_move_inner(uci).unwrap();
    }

    fn try_apply(game: &mut ChessGame, uci: &str) -> Result<(), String> {
        game.apply_move_inner(uci)
    }

    // --- new() ---

    #[test]
    fn new_initializes_starting_position() {
        let game = ChessGame::new();
        assert_eq!(
            game.current_fen(),
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        );
    }

    #[test]
    fn new_game_status_is_in_progress() {
        let game = ChessGame::new();
        assert_eq!(game.game_status(), GameStatus::InProgress);
    }

    // --- apply_move ---

    #[test]
    fn apply_move_valid_advances_position() {
        let mut game = ChessGame::new();
        apply(&mut game, "e2e4");
        let fen = game.current_fen();
        assert!(fen.starts_with("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq"));
    }

    #[test]
    fn apply_move_illegal_returns_err() {
        let mut game = ChessGame::new();
        let result = try_apply(&mut game, "e2e5");
        assert!(result.is_err());
    }

    #[test]
    fn apply_move_illegal_does_not_mutate_state() {
        let mut game = ChessGame::new();
        let fen_before = game.current_fen();
        let _ = try_apply(&mut game, "e2e5");
        assert_eq!(game.current_fen(), fen_before);
    }

    #[test]
    fn apply_move_nonsense_string_returns_err() {
        let mut game = ChessGame::new();
        assert!(try_apply(&mut game, "zzz").is_err());
    }

    #[test]
    fn apply_move_clears_redo_stack() {
        let mut game = ChessGame::new();
        apply(&mut game, "e2e4");
        game.undo();
        assert!(game.can_redo());
        apply(&mut game, "d2d4");
        assert!(!game.can_redo());
    }

    // --- undo ---

    #[test]
    fn undo_reverts_to_previous_position() {
        let mut game = ChessGame::new();
        let fen_before = game.current_fen();
        apply(&mut game, "e2e4");
        assert_ne!(game.current_fen(), fen_before);
        assert!(game.undo());
        assert_eq!(game.current_fen(), fen_before);
    }

    #[test]
    fn undo_pushes_onto_redo_stack() {
        let mut game = ChessGame::new();
        apply(&mut game, "e2e4");
        assert!(!game.can_redo());
        game.undo();
        assert!(game.can_redo());
    }

    #[test]
    fn undo_on_empty_history_returns_false() {
        let mut game = ChessGame::new();
        assert!(!game.undo());
    }

    #[test]
    fn undo_on_empty_history_does_not_panic() {
        let mut game = ChessGame::new();
        let _ = game.undo();
        let _ = game.undo();
    }

    // --- redo ---

    #[test]
    fn redo_reapplies_undone_move() {
        let mut game = ChessGame::new();
        apply(&mut game, "e2e4");
        let fen_after_move = game.current_fen();
        game.undo();
        assert_ne!(game.current_fen(), fen_after_move);
        assert!(game.redo());
        assert_eq!(game.current_fen(), fen_after_move);
    }

    #[test]
    fn redo_shrinks_redo_stack() {
        let mut game = ChessGame::new();
        apply(&mut game, "e2e4");
        apply(&mut game, "e7e5");
        game.undo();
        game.undo();
        assert!(game.can_redo());
        game.redo();
        game.redo();
        assert!(!game.can_redo());
    }

    #[test]
    fn redo_on_empty_stack_returns_false() {
        let mut game = ChessGame::new();
        assert!(!game.redo());
    }

    #[test]
    fn redo_on_empty_stack_does_not_panic() {
        let mut game = ChessGame::new();
        let _ = game.redo();
    }

    // --- game_status ---

    #[test]
    fn game_status_checkmate() {
        // Scholar's mate: 1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7#
        let mut game = ChessGame::new();
        apply(&mut game, "e2e4");
        apply(&mut game, "e7e5");
        apply(&mut game, "d1h5");
        apply(&mut game, "b8c6");
        apply(&mut game, "f1c4");
        apply(&mut game, "g8f6");
        apply(&mut game, "h5f7");
        assert_eq!(game.game_status(), GameStatus::Checkmate);
    }

    #[test]
    fn game_status_stalemate() {
        // Black king on a8, White king on a6, White queen on b6 - king has no moves, not in check
        let fen: Fen = "k7/8/KQ6/8/8/8/8/8 b - - 0 1".parse().unwrap();
        let pos: Chess = fen
            .into_position(shakmaty::CastlingMode::Standard)
            .unwrap();
        let game = ChessGame {
            history: vec![pos],
            redo_stack: Vec::new(),
        };
        assert_eq!(game.game_status(), GameStatus::Stalemate);
    }

    #[test]
    fn game_status_check() {
        // White rook on e1 gives check to black king on e8
        let fen: Fen = "4k3/8/8/8/8/8/8/4RK2 b - - 0 1".parse().unwrap();
        let pos: Chess = fen
            .into_position(shakmaty::CastlingMode::Standard)
            .unwrap();
        let game = ChessGame {
            history: vec![pos],
            redo_stack: Vec::new(),
        };
        assert_eq!(game.game_status(), GameStatus::Check);
    }

    #[test]
    fn game_status_in_progress_at_start() {
        let game = ChessGame::new();
        assert_eq!(game.game_status(), GameStatus::InProgress);
    }

    // --- can_undo / can_redo ---

    #[test]
    fn can_undo_false_at_start() {
        let game = ChessGame::new();
        assert!(!game.can_undo());
    }

    #[test]
    fn can_undo_true_after_move() {
        let mut game = ChessGame::new();
        apply(&mut game, "e2e4");
        assert!(game.can_undo());
    }

    #[test]
    fn can_redo_false_at_start() {
        let game = ChessGame::new();
        assert!(!game.can_redo());
    }

    #[test]
    fn can_redo_true_after_undo() {
        let mut game = ChessGame::new();
        apply(&mut game, "e2e4");
        game.undo();
        assert!(game.can_redo());
    }
}
