window.templates = {
  "activation": "<form class=\"form-signin\" role=\"form\">\n  <h1 class=\"form-signin-heading\">Screen activation</h1>\n  <input type=\"text\" class=\"form-control form-activation-code\" placeholder=\"Activation code\" required autofocus>\n  <button class=\"btn btn-primary btn-block btn-activate\" type=\"submit\">Activate</button>\n</form>",
  "slide": "<div class=\"slides\">\n  <ul>\n    {{ #slides }}\n    <li>\n      {{ #image }}\n        test\n        <img scr=\"\" />\n      {{ /image }}\n    </li>\n    {{ /slides }}\n  <ul>\n<div>"
}