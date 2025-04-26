// utils/revalidateFrontend.js
import axios from 'axios';

export async function revalidateFrontend(path) {
  try {
    const response = await axios.post('https://www.mirfah.com/api/revalidate', {
      path,
      token: process.env.REVALIDATE_SECRET, // same secret as frontend
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Revalidation triggered for:', path);
    return response.data;
  } catch (error) {
    console.error('❌ Revalidate API error:', error.response?.data || error.message);
  }
}
