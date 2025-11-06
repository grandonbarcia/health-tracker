async function addWhiteRice() {
  const whiteRiceData = {
    id: 'white-rice',
    name: 'white rice',
    serving: '1 cup cooked',
    calories: 206,
    protein: 4.3,
    carbs: 45,
    fat: 0.4,
    fiber: 0.6,
    sugar: 0.1,
    sodium: 1,
    calcium: 16,
    iron: 1.9,
    potassium: 55,
    vitaminC: 0,
    vitaminA: 0,
    vitaminD: 0,
    cholesterol: 0,
    aliases: ['rice', 'cooked rice', 'steamed rice'],
  };

  try {
    const response = await fetch('http://localhost:3000/api/foods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(whiteRiceData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Successfully added white rice to database:', result);
    } else {
      const error = await response.json();
      console.error('❌ Error adding white rice:', error);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

addWhiteRice();
