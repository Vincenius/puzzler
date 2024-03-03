import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Flex, Button, Paper, rem } from '@mantine/core';
import { IconArrowBigLeftLine, IconArrowBigRightLine, IconMicroscope, IconDots, IconX, IconCheck } from '@tabler/icons-react'

const parseMoves = moves => moves.split(' ').map(move => ({ from: move.slice(0,2), to: move.slice(2,4), promotion: move.slice(4,5) }));

export default function PuzzleBoard({ fen, moves, setSuccess, goNext, success, gameUrl, isLast }) {
  const [initFen, setInitFen] = useState(fen);
  const [game, setGame] = useState();
  const [moveFrom, setMoveFrom] = useState("");
  const [moveTo, setMoveTo] = useState(null);
  const [moveCount, setMoveCount] = useState(1)
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [rightClickedSquares, setRightClickedSquares] = useState({});
  const [optionSquares, setOptionSquares] = useState({});
  const parsedMoves = parseMoves(moves)

  const totalMoves = parsedMoves.length
  const gameLength = game ? game.history().length : 0
  const isDone = totalMoves === gameLength

  useEffect(() => {
    if (!game || fen !== initFen) {
      const initGame = new Chess(fen)
      setInitFen(fen)
      setGame(initGame)
    }
  }, [fen, initFen, game])

  useEffect(() => {
    if (game && game.fen() === fen && moves && success === undefined) {
      setTimeout(() => {
        const gameCopy = { ...game };
        gameCopy.move({
          from: parsedMoves[0].from,
          to: parsedMoves[0].to,
          promotion: parsedMoves[0].promotion
        });
        setGame(gameCopy)
        highlightMove(parsedMoves[0].from, parsedMoves[0].to)
      }, 750)
    }
  }, [fen, moves, game, parsedMoves, success])

  const highlightMove = (from, to) => {
    const colour = "rgba(155,199,0,.41)"
    setRightClickedSquares({
      [from]: { backgroundColor: colour },
      [to]: { backgroundColor: colour }
    });
  }

  const nextMove = () => {
    const gameCopy = { ...game };
    const nextMove = game.history().length
    gameCopy.move({
      from: parsedMoves[nextMove].from,
      to: parsedMoves[nextMove].to,
      promotion: parsedMoves[nextMove].promotion
    });
    setGame(gameCopy)
    highlightMove(parsedMoves[nextMove].from, parsedMoves[nextMove].to)
  }

  const handleNextPuzzle = () => {
    setMoveCount(1)
    goNext()
  }

  const getSolution = () => {
    handleSuccess(false)
    nextMove()
  }

  const handleSuccess = result => {
    if (success === undefined) {
      setSuccess(result)
    }
  }

  function safeGameMutate(modify) {
    setGame((g) => {
      const update = { ...g };
      modify(update);
      return update;
    });
  }

  function getMoveOptions(square) {
    if (!isDone) {
      const newMoves = game.moves({
        square,
        verbose: true,
      });
      if (newMoves.length === 0) {
        setOptionSquares({});
        return false;
      }

      const newSquares = {};
      newMoves.map((move) => {
        newSquares[move.to] = {
          background:
            game.get(move.to) &&
            game.get(move.to).color !== game.get(square).color
              ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
              : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
          borderRadius: "50%",
        };
        return move;
      });
      newSquares[square] = {
        background: "rgba(255, 255, 0, 0.4)",
      };
      setOptionSquares(newSquares);
      return true;
    } else {
      return false // solved already
    }
  }

  function handlePuzzleMove(moveFrom, square, promotion) {
    const solution = parsedMoves[moveCount];
    if (moveFrom === solution.from && square === solution.to && promotion === solution.promotion) {
      const nextMoveCount = moveCount + 1;
      const nextMove = parsedMoves[nextMoveCount]
      if (!nextMove) {
        handleSuccess(true)
        highlightMove(moveFrom, square)
      } else {
        setTimeout(() => {
          const gameCopy = { ...game }
          gameCopy.move({
            from: nextMove.from,
            to: nextMove.to,
            promotion: nextMove.promotion,
          });
          highlightMove(nextMove.from, nextMove.to)
          setGame(gameCopy);
          setMoveCount(moveCount+2)
        }, 500)
      }
    } else {
      handleSuccess(false)
      setTimeout(() => {
        safeGameMutate((game) => {
          game.undo();
        });
      }, 500)
    }
  }

  function handleMove({ moveFrom, square, foundMove }) {
    setMoveFrom(moveFrom);
    setMoveTo(square);

    // if promotion move
    if (
      (foundMove.color === "w" &&
        foundMove.piece === "p" &&
        square[1] === "8") ||
      (foundMove.color === "b" &&
        foundMove.piece === "p" &&
        square[1] === "1")
    ) {
      setShowPromotionDialog(true);
      return;
    }

    // is normal move
    const gameCopy = { ...game };
    const move = gameCopy.move({
      from: moveFrom,
      to: square,
    });

    // if invalid, setMoveFrom and getMoveOptions
    if (move === null) {
      const hasMoveOptions = getMoveOptions(square);
      if (hasMoveOptions) setMoveFrom(square);
      return;
    }

    setGame(gameCopy);
    setMoveFrom("");
    setMoveTo(null);
    setOptionSquares({});

    handlePuzzleMove(moveFrom, square, "");

    return;
  }

  function onSquareClick(square) {
    // setRightClickedSquares({});

    // from square
    if (!moveFrom) {
      const hasMoveOptions = getMoveOptions(square);
      if (hasMoveOptions) setMoveFrom(square);
      return;
    }

    const newMoves = game.moves({
      moveFrom,
      verbose: true,
    });
    const foundMove = newMoves.find(
      (m) => m.from === moveFrom && m.to === square
    );
    // not a valid move
    if (!foundMove) {
      if (moveFrom === square) {
        setMoveFrom("")
        setOptionSquares({});
        return
      } else {
        // check if clicked on new piece
        const hasMoveOptions = getMoveOptions(square);
        // if new piece, setMoveFrom, otherwise clear moveFrom
        setMoveFrom(hasMoveOptions ? square : "");
        return;
      }
    }

    handleMove({ moveFrom, square, foundMove })
  }

  function onPromotionCheck () {
    // prevent promotion on drop - promotion check is handled in onMove function
    return false
  }

  function onPromotionPieceSelect(piece) {
    // if no piece passed then user has cancelled dialog, don't make move and reset
    if (piece) {
      const gameCopy = { ...game };
      const promotionPiece = piece[1].toLowerCase() ?? "q";
      gameCopy.move({
        from: moveFrom,
        to: moveTo,
        promotion: promotionPiece,
      });
      setGame(gameCopy);
      handlePuzzleMove(moveFrom, moveTo, promotionPiece)
    }

    setMoveFrom("");
    setMoveTo(null);
    setShowPromotionDialog(false);
    setOptionSquares({});
    return true;
  }

  function onSquareRightClick(square) {
    // const colour = "rgba(0, 0, 255, 0.4)";
    // setRightClickedSquares({
    //   ...rightClickedSquares,
    //   [square]:
    //     rightClickedSquares[square] &&
    //     rightClickedSquares[square].backgroundColor === colour
    //       ? undefined
    //       : { backgroundColor: colour },
    // });
  }

  function onDrop(moveFrom, square) {
    setMoveFrom("")

    const moves = game.moves({
      moveFrom,
      verbose: true,
    });
    const foundMove = moves.find(
      (m) => m.from === moveFrom && m.to === square
    );
    // not a valid move
    if (!foundMove) {
      return false;
    }

    handleMove({ moveFrom, square, foundMove })

    return true;
  }

  if (!game) {
    return <></>
  }

  return (
    <>
      <Chessboard
        id="ClickToMove"
        animationDuration={200}
        position={game.fen()}
        onPieceDrop={onDrop}
        onSquareClick={onSquareClick}
        onSquareRightClick={onSquareRightClick}
        onPromotionPieceSelect={onPromotionPieceSelect}
        onPromotionCheck={onPromotionCheck}
        customBoardStyle={{
          borderRadius: "4px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)",
        }}
        customSquareStyles={{
          ...rightClickedSquares,
          ...optionSquares,
        }}
        promotionToSquare={moveTo}
        showPromotionDialog={showPromotionDialog}
        arePiecesDraggable={!isDone}
      />
      <Flex
        justify={{ sm: 'center' }}
      >
        <Button
          fullWidth
          variant="default"
          disabled={success === undefined || game.history().length === 0}
          onClick={() => safeGameMutate((game) => {
            game.undo();
            setRightClickedSquares({});
          })}
        >
          <IconArrowBigLeftLine/>
        </Button>
        <Button
          fullWidth
          variant="default"
          disabled={success === undefined || isDone}
          onClick={nextMove}
        >
          <IconArrowBigRightLine/>
        </Button>
        <Button
          fullWidth
          variant="default"
          disabled={success === undefined}
          href={gameUrl}
          component="a"
          target="_blank"
          rel="noopener"
        >
          <IconMicroscope/>
        </Button>
      </Flex>
      <Flex justify={{ sm: 'center' }}>
        <Paper withBorder p="sm" w="100%" style={{ textAlign: "center" }}>
          { success === undefined && <IconDots style={{ width: rem(80), height: rem(80) }} /> }
          { success === false && <IconX color="red" style={{ width: rem(80), height: rem(80) }} /> }
          { success === true && <IconCheck color="green" style={{ width: rem(80), height: rem(80) }} /> }
          { success === undefined && <Button
            fullWidth
            variant="default"
            disabled={success !== undefined}
            onClick={getSolution}
            size="compact-sm"
          >
            Lösung anzeigen
          </Button>}
        </Paper>
        <Button
          fullWidth
          variant="default"
          disabled={success === undefined || isLast}
          size="md"
          color="gray"
          h="auto"
          onClick={handleNextPuzzle}
        >
          Weiter
        </Button>
      </Flex>
    </>
  );
}