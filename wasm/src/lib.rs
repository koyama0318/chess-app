use shakmaty::fen::Fen;
use shakmaty::{CastlingMode, Chess, Position};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn greet() -> String {
    "hello world from wasm".to_string()
}

/// Core logic: returns legal moves in UCI notation for the given FEN.
/// Separated from wasm_bindgen so it can be tested natively.
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

/// WASM-exported wrapper that converts the Result<Vec<String>, String>
/// into Result<Vec<String>, JsValue> for JavaScript consumption.
#[wasm_bindgen]
pub fn get_legal_moves(fen: &str) -> Result<Vec<String>, JsValue> {
    get_legal_moves_core(fen).map_err(|e| JsValue::from_str(&e))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sorted_moves(fen: &str) -> Vec<String> {
        let mut moves = get_legal_moves_core(fen).unwrap();
        moves.sort();
        moves
    }

    // AC1: Starting position returns legal moves in UCI notation for all pieces
    #[test]
    fn test_starting_position_has_20_moves() {
        let moves = sorted_moves("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
        assert_eq!(moves.len(), 20);
        assert!(moves.contains(&"e2e4".to_string()));
        assert!(moves.contains(&"e2e3".to_string()));
        assert!(moves.contains(&"g1f3".to_string()));
        assert!(moves.contains(&"b1c3".to_string()));
    }

    // AC2: Castling
    #[test]
    fn test_castling_moves() {
        let moves = sorted_moves("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
        assert!(moves.contains(&"e1g1".to_string()), "kingside castling missing");
        assert!(moves.contains(&"e1c1".to_string()), "queenside castling missing");
    }

    // AC3: En passant
    #[test]
    fn test_en_passant() {
        let moves = sorted_moves("rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3");
        assert!(moves.contains(&"e5d6".to_string()), "en passant capture missing");
    }

    // AC4: Pawn promotion
    #[test]
    fn test_pawn_promotion() {
        // Black king on a8 so e8 is clear for promotion
        let moves = sorted_moves("k7/4P3/8/8/8/8/8/4K3 w - - 0 1");
        assert!(moves.contains(&"e7e8q".to_string()), "queen promotion missing");
        assert!(moves.contains(&"e7e8r".to_string()), "rook promotion missing");
        assert!(moves.contains(&"e7e8b".to_string()), "bishop promotion missing");
        assert!(moves.contains(&"e7e8n".to_string()), "knight promotion missing");
    }

    // AC5: Checkmate returns empty array
    #[test]
    fn test_checkmate_returns_empty() {
        let moves = sorted_moves("rnb1kbnr/pppp1ppp/4p3/8/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3");
        assert!(moves.is_empty(), "checkmate should have no legal moves");
    }

    // AC6: Invalid FEN causes error
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
}
