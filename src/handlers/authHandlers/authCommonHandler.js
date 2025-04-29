export const authCommonService = (() => {
    let id = '';
  
    const setId = (Id) => {
      id = Id;
    };
  
    const getId = () => {
      return id;
    };
  
    const httpOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        Accept: 'text/plain',
      },
    };
  
    return {
      setId,
      getId,
      httpOptions
    };
  })();