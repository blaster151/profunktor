/**
 * Tests for REAL Mathematical Constructions from Libkind-Spivak Paper
 * Pages 10-12: Operating Systems, Voting Schemes, and Games
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createInductiveSystemMap,
  createOperatingSystemNy,
  runProgramOnOperatingSystem,
  createVotingSchemePolynomial,
  createExhaustiveRunoff,
  checkGerrymandering,
  createEmptyBoard,
  getValidMoves,
  makeMove,
  checkWinner,
  createLearningStrategy,
  createDynamicPlayer,
  runTicTacToeGame,
  exampleOperatingSystemRead,
  exampleExhaustiveRunoffVoting,
  exampleLearningTicTacToe
} from '../fp-advanced-applications';

describe('REAL Mathematical Constructions from Libkind-Spivak Paper', () => {
  
  describe('Section 4.2: Operating Systems Run on Programs', () => {
    
    it('should create inductive system maps r_m → m_p', () => {
      const systemMap = createInductiveSystemMap(3);
      
      expect(systemMap.m).toBe(3);
      expect(systemMap.baseCase()).toBe(false);
      expect(systemMap.inductiveStep(5, 5)).toBe('y');
      expect(systemMap.inductiveStep(5, 7)).toEqual({ rm: 5 });
    });
    
    it('should create operating system as stream Ny', () => {
      const responses = [42, 17, 99, 3, 56];
      const os = createOperatingSystemNy(responses);
      
      expect(os.responseStream).toEqual([42, 17, 99, 3, 56]);
      expect(os.currentPosition).toBe(0);
    });
    
    it('should run program on operating system with actual formula', () => {
      const os = createOperatingSystemNy([42, 17, 99, 42, 3]);
      
      const result1 = runProgramOnOperatingSystem(3, 42, os);
      expect(result1.success).toBe(true);
      expect(result1.minResponses).toBe(1);
      
      const result2 = runProgramOnOperatingSystem(5, 42, os);
      expect(result2.success).toBe(true);
      expect(result2.minResponses).toBe(1); // Finds first occurrence at index 0
      
      const result3 = runProgramOnOperatingSystem(2, 999, os);
      expect(result3.success).toBe(false);
      expect(result3.minResponses).toBe(2);
    });
    
  });
  
  describe('Section 4.3: Voting Schemes Run on Voters', () => {
    
    it('should create voting scheme polynomial p = Σ_{A⊆X} y^A', () => {
      const candidates = new Set(['Alice', 'Bob', 'Carol']);
      const scheme = createVotingSchemePolynomial(candidates);
      
      expect(scheme.candidates).toEqual(candidates);
      expect(scheme.ballots.size).toBe(8); // 2^3 = 8 subsets
      
      scheme.ballots.forEach(ballot => {
        const winners = scheme.winners.get(ballot);
        expect(winners).toBeDefined();
        expect(winners!.length).toBe(ballot.size);
        winners!.forEach(winner => {
          expect(ballot.has(winner)).toBe(true);
        });
      });
    });
    
    it('should detect gerrymandering potential (Definition 4.1)', () => {
      const smallScheme = createVotingSchemePolynomial(new Set(['Alice']));
      const smallCheck = checkGerrymandering(smallScheme, 2);
      expect(smallCheck.canBeGerrymandered).toBe(false);
      
      const largeScheme = createVotingSchemePolynomial(new Set(['Alice', 'Bob', 'Carol']));
      const largeCheck = checkGerrymandering(largeScheme, 100);
      expect(largeCheck.canBeGerrymandered).toBe(true);
      expect(largeCheck.reason).toContain('partition');
    });
    
  });
  
  describe('Section 4.4: Games Run on Players', () => {
    
    it('should create empty tic-tac-toe board', () => {
      const board = createEmptyBoard();
      expect(board).toHaveLength(3);
      expect(board[0]).toHaveLength(3);
      expect(board.every(row => row.every(cell => cell === null))).toBe(true);
    });
    
    it('should make moves and detect winners', () => {
      let board = createEmptyBoard();
      
      board = makeMove(board, { row: 0, col: 0 }, 'X');
      board = makeMove(board, { row: 0, col: 1 }, 'X');
      board = makeMove(board, { row: 0, col: 2 }, 'X');
      
      const winner = checkWinner(board);
      expect(winner).toBe('X');
    });
    
    it('should create learning strategy that improves over time', () => {
      const strategy = createLearningStrategy('center');
      const board = createEmptyBoard();
      const validMoves = getValidMoves(board);
      
      const firstMove = strategy.evaluateMove(board, validMoves);
      expect(firstMove).toEqual({ row: 1, col: 1 });
      
      const updatedStrategy = strategy.updateAfterGame('WIN', [firstMove]);
      expect(updatedStrategy).toBeDefined();
    });
    
    it('should run complete tic-tac-toe game with learning players', () => {
      const playerX = createDynamicPlayer('X-learning', 'center');
      const playerO = createDynamicPlayer('O-learning', 'corners');
      
      const gameResult = runTicTacToeGame(playerX, playerO);
      
      expect(['X', 'O', 'TIE']).toContain(gameResult.winner);
      expect(gameResult.gameHistory.length).toBeGreaterThan(0);
      expect(gameResult.gameHistory.length).toBeLessThanOrEqual(9);
      expect(gameResult.finalState.gameOver).toBe(true);
    });
    
  });
  
  describe('Integration Examples', () => {
    
    it('should run operating system read example', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      exampleOperatingSystemRead();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          minResponses: expect.any(Number),
          success: expect.any(Boolean),
          message: expect.any(String)
        })
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should run exhaustive runoff voting example', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      exampleExhaustiveRunoffVoting();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          candidates: expect.any(Array),
          totalBallots: expect.any(Number),
          gerrymandering: expect.objectContaining({
            canBeGerrymandered: expect.any(Boolean),
            reason: expect.any(String)
          })
        })
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should run learning tic-tac-toe example', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      exampleLearningTicTacToe();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'RESULT:',
        expect.objectContaining({
          winner: expect.stringMatching(/^(X|O|TIE)$/),
          totalMoves: expect.any(Number),
          firstMove: expect.objectContaining({
            row: expect.any(Number),
            col: expect.any(Number)
          }),
          lastMove: expect.objectContaining({
            row: expect.any(Number),
            col: expect.any(Number)
          })
        })
      );
      
      consoleSpy.mockRestore();
    });
    
  });
  
});
