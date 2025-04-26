// utils/revalidateFrontend.js
import axios from 'axios';

export async function revalidateFrontend(paths) {
  console.log({ revalidatePaths: paths });
  
  try {
    const response = await axios.post('https://www.mirfah.com/api/revalidate', {
      paths, // sending an array
      token: process.env.REVALIDATE_SECRET,
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Revalidation triggered for:', paths);
    return response.data;
  } catch (error) {
    console.error('❌ Revalidate API error:', error.response?.data || error.message);
  }
}
