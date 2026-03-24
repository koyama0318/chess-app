use serde::Serialize;
use shakmaty::fen::Fen;
use shakmaty::{CastlingMode, Chess, Color, EnPassantMode, Position, Role};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn greet() -> String {
    "hello world from wasm".to_string()
}

// --- Legal Move Generation ---

fn get_legal_moves_core(fen: &str) -> Result<Vec<String>, String> {
    let fen: Fen = fen.parse().map_err(|e| format!("invalid FEN: {}", e))?;
    let pos: Chess = fen
        .into_position(CastlingMode::Standard)
        .map_err(|e| format!("illegal position: {}", e))?;
    let legal_moves = pos.legal_moves();
    let uci_moves: Vec<String> = legal_moves
        .iter()
        .map(|m| m.to_uci(CastlingMode::Standard).to_string())
        .collect();
    Ok(uci_moves)
}

#[wasm_bindgen]
pub fn get_legal_moves(fen: &str) -> Result<Vec<String>, JsValue> {
    get_legal_moves_core(fen).map_err(|e| JsValue::from_str(&e))
}

// --- FEN API ---

#[wasm_bindgen]
pub fn fen_from_starting_position() -> String {
    Fen::default().to_string()
}

pub(crate) fn fen_roundtrip_inner(fen: &str) -> Result<String, String> {
    let parsed: Fen = fen
        .parse()
        .map_err(|e: shakmaty::fen::ParseFenError| e.to_string())?;
    let position = parsed
        .into_position::<Chess>(CastlingMode::Standard)
        .map_err(|e| e.to_string())?;
    let fen_out = Fen::from_position(position, EnPassantMode::Legal);
    Ok(fen_out.to_string())
}

#[wasm_bindgen]
pub fn fen_roundtrip(fen: &str) -> Result<String, JsValue> {
    fen_roundtrip_inner(fen).map_err(|e| JsValue::from_str(&e))
}

// --- Chess Game ---

#[wasm_bindgen]
#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GameStatus {
    InProgress = 0,
    Checkmate = 1,
    Stalemate = 2,
    Draw = 3,
}

fn piece_char(color: Color, role: Role) -> String {
    let c = match role {
        Role::Pawn => 'p',
        Role::Knight => 'n',
        Role::Bishop => 'b',
        Role::Rook => 'r',
        Role::Queen => 'q',
        Role::King => 'k',
    };
    if color == Color::White {
        c.to_ascii_uppercase().to_string()
    } else {
        c.to_string()
    }
}

#[derive(Serialize)]
struct RenderStateData {
    fen: String,
    board: HashMap<String, String>,
    #[serde(rename = "legalMoves")]
    legal_moves: Vec<String>,
    status: u8,
    #[serde(rename = "isCheck")]
    is_check: bool,
    #[serde(rename = "canUndo")]
    can_undo: bool,
    #[serde(rename = "canRedo")]
    can_redo: bool,
    #[serde(rename = "currentTurn")]
    current_turn: String,
}

#[wasm_bindgen]
pub struct ChessGame {
    history: Vec<Chess>,
    redo_stack: Vec<Chess>,
}

impl ChessGame {
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

    fn current_pos(&self) -> &Chess {
        self.history.last().expect("history must never be empty")
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

    pub fn from_fen(fen_str: &str) -> Result<ChessGame, JsValue> {
        let fen: Fen = fen_str
            .parse()
            .map_err(|e| JsValue::from_str(&format!("invalid FEN: {}", e)))?;
        let pos: Chess = fen
            .into_position(CastlingMode::Standard)
            .map_err(|e| JsValue::from_str(&format!("illegal position: {}", e)))?;
        Ok(ChessGame {
            history: vec![pos],
            redo_stack: Vec::new(),
        })
    }

    pub fn new_from_fen(fen_str: &str) -> Result<ChessGame, JsValue> {
        ChessGame::from_fen(fen_str)
    }

    pub fn current_fen(&self) -> String {
        Fen::from_position(self.current_pos().clone(), EnPassantMode::Legal).to_string()
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
        let pos = self.current_pos();
        if pos.is_checkmate() {
            GameStatus::Checkmate
        } else if pos.is_stalemate() {
            GameStatus::Stalemate
        } else if pos.is_insufficient_material() {
            GameStatus::Draw
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

    pub fn reset(&mut self) {
        self.history = vec![Chess::default()];
        self.redo_stack.clear();
    }

    pub fn render_state(&self) -> Result<JsValue, JsValue> {
        let pos = self.current_pos();
        let fen = Fen::from_position(pos.clone(), EnPassantMode::Legal).to_string();

        let board: HashMap<String, String> = pos
            .board()
            .clone()
            .into_iter()
            .map(|(sq, piece)| {
                let sq_str = sq.to_string();
                let piece_str = piece_char(piece.color, piece.role);
                (sq_str, piece_str)
            })
            .collect();

        let legal_moves = get_legal_moves_core(&fen).unwrap_or_default();

        let current_turn = if pos.turn() == Color::White {
            "white".to_string()
        } else {
            "black".to_string()
        };

        let data = RenderStateData {
            fen,
            board,
            legal_moves,
            status: self.game_status() as u8,
            is_check: pos.is_check(),
            can_undo: self.can_undo(),
            can_redo: self.can_redo(),
            current_turn,
        };

        serde_wasm_bindgen::to_value(&data).map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // --- get_legal_moves tests ---

    fn sorted_moves(fen: &str) -> Vec<String> {
        let mut moves = get_legal_moves_core(fen).unwrap();
        moves.sort();
        moves
    }

    #[test]
    fn test_starting_position_has_20_moves() {
        let moves = sorted_moves("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
        assert_eq!(moves.len(), 20);
        assert!(moves.contains(&"e2e4".to_string()));
        assert!(moves.contains(&"e2e3".to_string()));
        assert!(moves.contains(&"g1f3".to_string()));
        assert!(moves.contains(&"b1c3".to_string()));
    }

    #[test]
    fn test_castling_moves() {
        let moves = sorted_moves("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
        assert!(moves.contains(&"e1g1".to_string()), "kingside castling missing");
        assert!(moves.contains(&"e1c1".to_string()), "queenside castling missing");
    }

    #[test]
    fn test_en_passant() {
        let moves = sorted_moves("rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3");
        assert!(moves.contains(&"e5d6".to_string()), "en passant capture missing");
    }

    #[test]
    fn test_pawn_promotion() {
        let moves = sorted_moves("k7/4P3/8/8/8/8/8/4K3 w - - 0 1");
        assert!(moves.contains(&"e7e8q".to_string()), "queen promotion missing");
        assert!(moves.contains(&"e7e8r".to_string()), "rook promotion missing");
        assert!(moves.contains(&"e7e8b".to_string()), "bishop promotion missing");
        assert!(moves.contains(&"e7e8n".to_string()), "knight promotion missing");
    }

    #[test]
    fn test_checkmate_returns_empty() {
        let moves = sorted_moves("rnb1kbnr/pppp1ppp/4p3/8/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3");
        assert!(moves.is_empty(), "checkmate should have no legal moves");
    }

    #[test]
    fn test_invalid_fen_returns_error() {
        let result = get_legal_moves_core("not a valid fen");
        assert!(result.is_err(), "invalid FEN should return error");
    }

    #[test]
    fn test_empty_fen_returns_error() {
        let result = get_legal_moves_core("");
        assert!(result.is_err(), "empty FEN should return error");
    }

    #[test]
    fn test_stalemate_returns_empty() {
        let moves = sorted_moves("k7/8/KQ6/8/8/8/8/8 b - - 0 1");
        assert!(moves.is_empty(), "stalemate should have no legal moves");
    }

    // --- FEN API tests ---

    #[test]
    fn test_fen_starting_position() {
        assert_eq!(
            fen_from_starting_position(),
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        );
    }

    #[test]
    fn test_fen_roundtrip_valid() {
        let input = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        assert_eq!(fen_roundtrip_inner(input).unwrap(), input);
    }

    #[test]
    fn test_fen_roundtrip_after_e4() {
        let input = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
        let expected = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
        assert_eq!(fen_roundtrip_inner(input).unwrap(), expected);
    }

    #[test]
    fn test_fen_roundtrip_invalid() {
        assert!(fen_roundtrip_inner("not a fen string").is_err());
    }

    // --- ChessGame tests ---

    fn apply(game: &mut ChessGame, uci: &str) {
        game.apply_move_inner(uci).unwrap();
    }

    fn try_apply(game: &mut ChessGame, uci: &str) -> Result<(), String> {
        game.apply_move_inner(uci)
    }

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

    #[test]
    fn game_status_checkmate() {
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
    fn check_position_game_status_is_in_progress() {
        // In check, game is still InProgress (not a terminal state)
        let fen: Fen = "4k3/8/8/8/8/8/8/4RK2 b - - 0 1".parse().unwrap();
        let pos: Chess = fen
            .into_position(shakmaty::CastlingMode::Standard)
            .unwrap();
        assert!(pos.is_check(), "position should be in check");
        let game = ChessGame {
            history: vec![pos],
            redo_stack: Vec::new(),
        };
        // game_status() returns InProgress for check (not a separate Check state)
        assert_eq!(game.game_status(), GameStatus::InProgress);
    }

    #[test]
    fn is_check_detected_via_position() {
        let fen: Fen = "4k3/8/8/8/8/8/8/4RK2 b - - 0 1".parse().unwrap();
        let pos: Chess = fen
            .into_position(shakmaty::CastlingMode::Standard)
            .unwrap();
        // pos.is_check() should return true for this check position
        assert!(pos.is_check());
    }

    #[test]
    fn game_status_in_progress_at_start() {
        let game = ChessGame::new();
        assert_eq!(game.game_status(), GameStatus::InProgress);
    }

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

    #[test]
    fn reset_returns_to_starting_position() {
        let mut game = ChessGame::new();
        apply(&mut game, "e2e4");
        apply(&mut game, "e7e5");
        game.reset();
        assert_eq!(
            game.current_fen(),
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        );
    }

    #[test]
    fn reset_clears_undo_history() {
        let mut game = ChessGame::new();
        apply(&mut game, "e2e4");
        assert!(game.can_undo());
        game.reset();
        assert!(!game.can_undo());
    }

    #[test]
    fn reset_clears_redo_stack() {
        let mut game = ChessGame::new();
        apply(&mut game, "e2e4");
        game.undo();
        assert!(game.can_redo());
        game.reset();
        assert!(!game.can_redo());
    }

    #[test]
    fn reset_on_fresh_game_is_idempotent() {
        let mut game = ChessGame::new();
        game.reset();
        assert_eq!(
            game.current_fen(),
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        );
    }
}
