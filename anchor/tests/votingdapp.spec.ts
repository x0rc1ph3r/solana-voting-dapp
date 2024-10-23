import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Voting } from '../target/types/voting'
import { startAnchor } from 'anchor-bankrun'
import { BankrunProvider } from 'anchor-bankrun'

const IDL = require('../target/idl/voting.json');

const votingAddress = new PublicKey('AsjZ3kWAUSQRNt2pZVeJkywhZ6gpLpHZmJjduPmKZDZZ');

describe('Voting', () => {

  let context;
  let provider;
  let votingProgram: Program<Voting>;

  beforeAll(async () => {
    context = await startAnchor("", [{ name: "voting", programId: votingAddress }], []);
    provider = new BankrunProvider(context);

    votingProgram = new Program<Voting>(
      IDL,
      provider
    );
  })

  it('Initialize Poll', async () => {

    await votingProgram.methods.initializePoll(
      new anchor.BN(1),
      "What is your favourite type of peanut butter?",
      new anchor.BN(0),
      new anchor.BN(1829665067),
    ).rpc();

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      votingAddress
    )

    const poll = await votingProgram.account.poll.fetch(pollAddress);

    console.log(poll);

    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.description).toEqual("What is your favourite type of peanut butter?");
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());
  })

  it('Initialize Candidate', async () => {
    await votingProgram.methods.initializeCandidate(
      "Farman",
      new anchor.BN(1),
    ).rpc();
    await votingProgram.methods.initializeCandidate(
      "Suhana",
      new anchor.BN(1),
    ).rpc();

    const [farmanAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Farman")],
      votingAddress
    )

    const farmanCandidate = await votingProgram.account.candidate.fetch(farmanAddress);

    console.log(farmanCandidate);
    expect(farmanCandidate.candidateVotes.toNumber()).toEqual(0);
    expect(farmanCandidate.candidateName).toEqual("Farman");


    const [suhanaAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Suhana")],
      votingAddress
    )

    const suhanaCandidate = await votingProgram.account.candidate.fetch(suhanaAddress);

    console.log(suhanaCandidate);
    expect(suhanaCandidate.candidateVotes.toNumber()).toEqual(0);
    expect(suhanaCandidate.candidateName).toEqual("Suhana");
  })

  it('Vote', async () => {
    await votingProgram.methods.vote(
      "Farman",
      new anchor.BN(1),
    ).rpc();

    const [farmanAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Farman")],
      votingAddress
    )

    const farmanCandidate = await votingProgram.account.candidate.fetch(farmanAddress);

    console.log(farmanCandidate);
    expect(farmanCandidate.candidateVotes.toNumber()).toEqual(1);
  })
})
