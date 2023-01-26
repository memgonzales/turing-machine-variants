# Turing Machine Variants

![badge][badge-html5]
![badge][badge-bootstrap]
![badge][badge-js]
![badge][badge-jquery]
![badge][badge-prettier]
![Vercel](https://therealsujitk-vercel-badge.vercel.app/?app=turing-machine-variants)

This project is an interactive website for simulating the following abstract machines:
- Two-way deterministic and nondeterministic **finite automata**
- Two-way deterministic and nondeterministic **Turing machines with two-dimensional tapes**
- Two-way deterministic and nondeterministic **<i>k</i>-queue automata**

This website also allows the user to explore all the possible paths (runs) for nondeterministic automata. 

## Project Structure
This project consists of the following folders:

| Folder                                                                                | Description                   |
| ------------------------------------------------------------------------------------- | ----------------------------- |
| [`assets`](https://github.com/memgonzales/turing-machine-variants/tree/master/assets)   | Contains the image files      |
| [`scripts`](https://github.com/memgonzales/turing-machine-variants/tree/master/scripts) | Contains the JavaScript files |
| [`style`](https://github.com/memgonzales/turing-machine-variants/tree/master/style)     | Contains the CSS style sheets |

It also includes the following files:

| File                                                                                              | Description                                                 |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [`index.html`](https://github.com/memgonzales/turing-machine-variants/blob/master/index.html)     | Webpage for finite automata (home page)                        |
| [`k-queue.html`](https://github.com/memgonzales/turing-machine-variants/blob/master/k-queue.html)   | Webpage for Turing machines with two-dimensional tapes  |
| [`turing-2d.html`](https://github.com/memgonzales/turing-machine-variants/blob/master/turing-2d.html) | Webpage for <i>k</i>-queue automata                         |

## Running the Simulator

### Running on the Web

Open the following website: https://turing-machine-variants.vercel.app/

### Running Locally

1. Create a copy of this repository:

    - If [git](https://git-scm.com/downloads) is installed, type the following command on the terminal:

        ```
        git clone https://github.com/memgonzales/turing-machine-variants
        ```

    - If git is not installed, click the green `Code` button near the top right of the repository and choose [`Download ZIP`](https://github.com/memgonzales/turing-machine-variants/archive/refs/heads/master.zip). Once the zipped folder has been downloaded, extract its contents.

2. Open [`index.html`](https://github.com/memgonzales/turing-machine-variants/blob/master/index.html).

    - There is no need to install any additional software or dependency. However, internet connection is required to load fonts, libraries, and toolkits from their respective content delivery networks (CDNs).

<br>

   <img src="https://github.com/memgonzales/turing-machine-variants/blob/master/assets/screenshot-1.PNG?raw=True" alt="Turing machine" width = 750> <br>
   <img src="https://github.com/memgonzales/turing-machine-variants/blob/master/assets/screenshot-2.PNG?raw=True" alt="k-queue automaton" width = 750> <br>
   <img src="https://github.com/memgonzales/turing-machine-variants/blob/master/assets/screenshot-3.PNG?raw=True" alt="nondeterminism" width = 750> <br>
   


## Built Using

This project uses **JavaScript** to carry out all the operations and computations on the client-side. Additional libraries and toolkits are enumerated in the following table:

| Library/Toolkit                                                            | Version | Description                                                                                                                  | License                                                                        |
| -------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [jQuery](https://jquery.com/)                                              | 3.5.1   | Fast, small, and feature-rich JavaScript library for HTML document traversal and manipulation, event handling, and animation | MIT License                                                                    |
| [Bootstrap](https://getbootstrap.com/)  | 5.0.2 | Front-end toolkit featuring Sass variables and mixins, responsive grid system, prebuilt components, and JavaScript plugins | MIT License |

_The descriptions of these technologies are taken from their respective websites._

The opinionated code formatter [Prettier](https://prettier.io/) was employed to enforce uniformity and consistency of coding style.

This website is deployed on the cloud platform-as-a-service [Vercel](https://vercel.com/).

## Author
-   <b>Mark Edward M. Gonzales</b> <br/>
    mark_gonzales@dlsu.edu.ph <br/>
    gonzales.markedward@gmail.com <br/>
    
Assets (images) are properties of their respective owners. Attribution is found in the [credits](https://github.com/memgonzales/turing-machine-variants/blob/master/CREDITS.md) file.

[badge-html5]: https://img.shields.io/badge/html5-%23E34F26.svg?style=flat&logo=html5&logoColor=white
[badge-bootstrap]: https://img.shields.io/badge/bootstrap-%23563D7C.svg?style=flat&logo=bootstrap&logoColor=white
[badge-js]: https://img.shields.io/badge/javascript-%23323330.svg?style=flate&logo=javascript&logoColor=%23F7DF1E
[badge-jquery]: https://img.shields.io/badge/jquery-%230769AD.svg?style=flat&logo=jquery&logoColor=white
[badge-php]: https://img.shields.io/badge/PHP-777BB4?style=flate&logo=php&logoColor=white
[badge-prettier]: https://img.shields.io/badge/prettier-1A2C34?style=flat&logo=prettier&logoColor=F7BA3E
[badge-heroku]: https://img.shields.io/badge/Heroku-430098?style=flat&logo=heroku&logoColor=white
