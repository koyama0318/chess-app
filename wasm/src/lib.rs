use shakmaty::fen::Fen;
use shakmaty::CastlingMode;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn greet() -> String {
    "hello world from wasm".to_string()
}

#[wasm_bindgen]
pub fn fen_from_starting_position() -> String {
    Fen::default().to_string()
}

#[wasm_bindgen]
pub fn fen_is_valid(fen: &str) -> bool {
    fen_roundtrip_inner(fen).is_ok()
}

pub(crate) fn fen_roundtrip_inner(fen: &str) -> Result<String, String> {
    let parsed: Fen = fen
        .parse()
        .map_err(|e: shakmaty::fen::ParseFenError| e.to_string())?;
    let position = parsed
        .into_position::<shakmaty::Chess>(CastlingMode::Standard)
        .map_err(|e| e.to_string())?;
    let fen_out = Fen::from_position(position, shakmaty::EnPassantMode::Legal);
    Ok(fen_out.to_string())
}

#[wasm_bindgen]
pub fn fen_roundtrip(fen: &str) -> Result<String, JsValue> {
    fen_roundtrip_inner(fen).map_err(|e| JsValue::from_str(&e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_starting_position() {
        assert_eq!(
            fen_from_starting_position(),
            "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        );
    }

    #[test]
    fn test_valid_fen() {
        assert!(fen_is_valid("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"));
        assert!(fen_is_valid("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"));
    }

    #[test]
    fn test_invalid_fen() {
        assert!(!fen_is_valid("not a fen string"));
        assert!(!fen_is_valid(""));
    }

    #[test]
    fn test_roundtrip_valid() {
        let input = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        assert_eq!(fen_roundtrip_inner(input).unwrap(), input);
    }

    #[test]
    fn test_roundtrip_after_e4() {
        let input = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
        let expected = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
        assert_eq!(fen_roundtrip_inner(input).unwrap(), expected);
    }

    #[test]
    fn test_roundtrip_invalid() {
        assert!(fen_roundtrip_inner("not a fen string").is_err());
    }
}
