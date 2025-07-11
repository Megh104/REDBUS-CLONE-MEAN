declare const process: {
  env: {
    API_URL: string;
  };
};

export const url: string = process.env.API_URL || 'http://localhost:5000/';