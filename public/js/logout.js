import axios from "axios";

export const logout = async () => {
  const hideAlert = () => {
    const el = document.querySelector(".alert");
    if (el) el.parentElement.removeChild(el);
  };

  const showAlert = (type, msg) => {
    hideAlert();
    let color;
    if (type === "error") color = "#a64452";
    else color = "#4bb543";
    const markup = `<div class="alert alert--${type}" style="display:block;margin:auto;text-align:center;height:22%;font-size:18px;background-color:${color};">${msg}</div>`;
    document.querySelector("body").insertAdjacentHTML("afterbegin", markup);
    window.setTimeout(hideAlert, 5000);
  };
  try {
    const res = await axios({
      method: "GET",
      url: "/api/v1/logout",
    });
    if ((res.data.status = "success")) location.reload(true);
    window.setTimeout(alert("Logged out successfully!!"), 1000);
    window.location.replace("https://shopping-buddy76.herokuapp.com/");
  } catch (err) {
    console.log(err.response);
    showAlert("error", "Error logging out! Try again.");
  }
};
