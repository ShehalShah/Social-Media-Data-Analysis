import React from 'react';
export const ErrorMessage = ({ message }) => (
  <div className="p-10 text-center font-semibold text-red-500 bg-red-100 rounded-lg">{message}</div>
);