export async function fetchPost(url, data, options) {
    return fetch(url, {
      method: 'POST',
      headers: options?.headers || { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(response => response.json());
  }
  
  export async function fetchGet(url, options) {
    return fetch(url, {
      method: 'GET',
      headers: options?.headers || { 'Content-Type': 'application/json' }
    }).then(response => response.json());
  }