import dotenv from 'dotenv';
dotenv.config();
import { searchFoods } from '../src/lib/db.js';

(async () => {
  const res = await searchFoods('green smoothie', 10);
  console.log(JSON.stringify(res, null, 2));
})();
