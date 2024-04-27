// import { parse } from 'csv-parse/sync';
// import fs from 'fs';
// import { MongoClient } from 'mongodb';

// export default async function handler(req, res) {
//   if (req.method === 'POST') {
//     const client = new MongoClient(process.env.MONGODB_URI);
//     console.log('loading puzzles')
//     const file = fs.readFileSync(process.cwd() + '/data/lichess_db_puzzle.csv')
//     const records = parse(file, {
//       columns: true,
//       skip_empty_lines: true
//     });
//     console.log('done loading')
//     const useRecords = records
//       .sort((a, b) => parseInt(b.Popularity) - parseInt(a.Popularity))
//       .slice(0,800000)
//     const batchSize = 1000;
//     let currentIndex = 0;
//     try {
//       await client.connect();
//       console.log('Connected to MongoDB server');
  
//       const db = client.db(process.env.MONGODB_DB);
//       const puzzlesCollection = db.collection('puzzles');
  
//       while (currentIndex < useRecords.length) {
//         // Get the current batch of puzzles
//         const currentBatch = useRecords.slice(currentIndex, currentIndex + batchSize);
//         const mapped = currentBatch.map(p => ({
//           ...p,
//           Themes: p.Themes.split(' '),
//         }))
//         // Insert the current batch into the collection
//         const result = await puzzlesCollection.insertMany(mapped);
//         console.log(`${currentIndex} of ${useRecords.length} puzzles inserted successfully`);
  
//         // Move to the next batch
//         currentIndex += batchSize;
//       }
//     } catch (error) {
//       console.error('Error inserting puzzles:', error);
//     } finally {
//       // Close the connection
//       client.close();
//     }
//   }


//   res.status(200).json({ name: "John Doe" });


//   // // {
//   //   PuzzleId: '00008',
//   //   FEN: 'r6k/pp2r2p/4Rp1Q/3p4/8/1N1P2R1/PqP2bPP/7K b - - 0 24',
//   //   Moves: 'f2g3 e6e7 b2b1 b3c1 b1c1 h6c1',
//   //   Rating: '1951',
//   //   RatingDeviation: '77',
//   //   Popularity: '94',
//   //   NbPlays: '5235',
//   //   Themes: 'crushing hangingPiece long middlegame',
//   //   GameUrl: 'https://lichess.org/787zsVup/black#Some(47)',
//   //   OpeningTags: ''
//   // }
// }
