use wasm_bindgen_test::*;

use chess_wasm::{fen_from_starting_position, fen_is_valid, fen_roundtrip};

#[wasm_bindgen_test]
fn test_fen_from_starting_position() {
    let fen = fen_from_starting_position();
    assert_eq!(
        fen,
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    );
}

#[wasm_bindgen_test]
fn test_fen_is_valid_with_starting_position() {
    assert!(fen_is_valid(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    ));
}

#[wasm_bindgen_test]
fn test_fen_is_valid_with_other_valid_fen() {
    assert!(fen_is_valid(
        "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
    ));
}

#[wasm_bindgen_test]
fn test_fen_is_valid_with_invalid_fen() {
    assert!(!fen_is_valid("not a fen string"));
}

#[wasm_bindgen_test]
fn test_fen_is_valid_with_empty_string() {
    assert!(!fen_is_valid(""));
}

#[wasm_bindgen_test]
fn test_fen_roundtrip_with_starting_position() {
    let input = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    let result = fen_roundtrip(input).unwrap();
    assert_eq!(result, input);
}

#[wasm_bindgen_test]
fn test_fen_roundtrip_with_other_valid_fen() {
    let input = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
    let expected = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    let result = fen_roundtrip(input).unwrap();
    assert_eq!(result, expected);
}

#[wasm_bindgen_test]
fn test_fen_roundtrip_with_invalid_fen() {
    let result = fen_roundtrip("not a fen string");
    assert!(result.is_err());
}
