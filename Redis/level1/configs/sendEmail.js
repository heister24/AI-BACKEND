const sendEmail = async (email) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
      console.log("task completed");
    }, 5000);
  });
};

export default sendEmail;
