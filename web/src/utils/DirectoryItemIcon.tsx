import {
  FaFolder,
  FaFileAlt,
  FaFileImage,
  FaDatabase,
  FaFilePdf,
  FaFileArchive,
  FaHtml5,
  FaCss3,
  FaJava,
  FaMusic,
  FaPython,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFolderOpen,
  FaMarkdown,
  FaReact,
  FaSwift,
  FaRust,
  FaVuejs,
  FaFont,
  FaWindows,
} from "react-icons/fa";
import { FaGear, FaSquareBinary, FaDartLang } from "react-icons/fa6";
import { IoLogoJavascript, IoMdCube } from "react-icons/io";
import { BiMoviePlay } from "react-icons/bi";
import { TbBrandCSharp, TbBrandPowershell } from "react-icons/tb";
import { VscJson } from "react-icons/vsc";
import { LuCodeXml } from "react-icons/lu";
import { RiPhpFill, RiSvelteFill } from "react-icons/ri";
import { GrDocumentConfig } from "react-icons/gr";
import type { DirectoryItem } from "../types/DirectoryItem";
import { FaGolang } from "react-icons/fa6";
import { MdDownloadForOffline } from "react-icons/md";
import {
  SiCplusplus,
  SiC,
  SiBlender,
  SiFortran,
  SiBlockbench,
  SiGodotengine,
  SiLua,
  SiDelphi,
  SiElixir,
  SiKotlin,
  SiScala,
  SiPerl,
  SiFsharp,
  SiGradle,
  SiZig,
  SiGimp,
  SiToml,
  SiSolidity,
  SiDotenv,
  SiUtorrent,
  SiFedora,
  SiAppimage,
  SiSnapcraft,
} from "react-icons/si";
import {
  DiAndroid,
  DiRuby,
  DiVisualstudio,
  DiHaskell,
  DiPhotoshop,
  DiDebian,
} from "react-icons/di";
import { AiFillSafetyCertificate } from "react-icons/ai";
import { PiMathOperationsFill } from "react-icons/pi";
import { CiText } from "react-icons/ci";

interface DirectoryItemIconProps {
  logoSize: number;
  itemInfo: DirectoryItem;
}

export const DirectoryItemIcon: React.FC<DirectoryItemIconProps> = ({ logoSize, itemInfo }) => {
  const icons: { [key: string]: JSX.Element } = {
    folder: <FaFolder size={logoSize} className='mx-2' style={{ color: "blue" }} />,
    folderOpen: <FaFolderOpen size={logoSize} className='mx-2' />,
    image: <FaFileImage size={logoSize} className='mx-2' />,
    pdf: <FaFilePdf size={logoSize} className='mx-2' />,
    archive: <FaFileArchive size={logoSize} className='mx-2' />,
    html: <FaHtml5 size={logoSize} className='mx-2' />,
    css: <FaCss3 size={logoSize} className='mx-2' />,
    golang: <FaGolang size={logoSize} className='mx-2' />,
    audio: <FaMusic size={logoSize} className='mx-2' />,
    video: <BiMoviePlay size={logoSize} className='mx-2' />,
    java: <FaJava size={logoSize} className='mx-2' />,
    javascript: <IoLogoJavascript size={logoSize} className='mx-2' />,
    react: <FaReact size={logoSize} className='mx-2' />,
    vue: <FaVuejs size={logoSize} className='mx-2' />,
    svelte: <RiSvelteFill size={logoSize} className='mx-2' />,
    csharp: <TbBrandCSharp size={logoSize} className="mx-2" />,
    exe: <FaGear size={logoSize} className="mx-2" />,
    database: <FaDatabase size={logoSize} className="mx-2" />,
    python: <FaPython size={logoSize} className="mx-2" />,
    json: <VscJson size={logoSize} className="mx-2" />,
    msword: <FaFileWord size={logoSize} className="mx-2" />,
    msexcel: <FaFileExcel size={logoSize} className="mx-2" />,
    mspowerpoint: <FaFilePowerpoint size={logoSize} className="mx-2" />,
    code: <LuCodeXml size={logoSize} className="mx-2" />,
    php: <RiPhpFill size={logoSize + 5} className="mx-2" />,
    shell: <TbBrandPowershell size={logoSize} className="mx-2" />,
    config: <GrDocumentConfig size={logoSize} className="mx-2" />,
    markdown: <FaMarkdown size={logoSize} className="mx-2" />,
    iso: <MdDownloadForOffline size={logoSize} className="mx-2" />,
    cpp: <SiCplusplus size={logoSize} className="mx-2" />,
    c: <SiC size={logoSize} className="mx-2" />,
    binary: <FaSquareBinary size={logoSize} className="mx-2" />,
    blender: <SiBlender size={logoSize} className="mx-2" />,
    fortran: <SiFortran size={logoSize} className="mx-2" />,
    apk: <DiAndroid size={logoSize} className="mx-2" />,
    blockbench: <SiBlockbench size={logoSize} className="mx-2" />,
    godot: <SiGodotengine size={logoSize} className="mx-2" />,
    ruby: <DiRuby size={logoSize} className="mx-2" />,
    lua: <SiLua size={logoSize} className="mx-2" />,
    swift: <FaSwift size={logoSize} className="mx-2" />,
    visualbasic: <DiVisualstudio size={logoSize} className="mx-2" />,
    delphi: <SiDelphi size={logoSize} className="mx-2" />,
    elixir: <SiElixir size={logoSize} className="mx-2" />,
    kotlin: <SiKotlin size={logoSize} className="mx-2" />,
    rust: <FaRust size={logoSize} className="mx-2" />,
    scala: <SiScala size={logoSize} className="mx-2" />,
    perl: <SiPerl size={logoSize} className="mx-2" />,
    fsharp: <SiFsharp size={logoSize} className="mx-2" />,
    dart: <FaDartLang size={logoSize} className="mx-2" />,
    gradle: <SiGradle size={logoSize} className="mx-2" />,
    haskell: <DiHaskell size={logoSize} className="mx-2" />,
    zig: <SiZig size={logoSize} className="mx-2" />,
    gimp: <SiGimp size={logoSize} className="mx-2" />,
    photoshop: <DiPhotoshop size={logoSize} className="mx-2" />,
    toml: <SiToml size={logoSize} className="mx-2" />,
    solidity: <SiSolidity size={logoSize} className="mx-2" />,
    cube3d: <IoMdCube size={logoSize} className="mx-2" />,
    dotenv: <SiDotenv size={logoSize} className="mx-2" />,
    font: <FaFont size={logoSize} className="mx-2" />,
    certificate: <AiFillSafetyCertificate size={logoSize} className="mx-2" />,
    scientific: <PiMathOperationsFill size={logoSize} className="mx-2" />,
    torrent: <SiUtorrent size={logoSize} className="mx-2" />,
    debian: <DiDebian size={logoSize} className="mx-2" />,
    fedora: <SiFedora size={logoSize} className="mx-2" />,
    appimage: <SiAppimage size={logoSize} className="mx-2" />,
    snapcraft: <SiSnapcraft size={logoSize} className="mx-2" />,
    text: <CiText size={logoSize} className="mx-2" />,
    windows: <FaWindows size={logoSize} className="mx-2" />,
    default: <FaFileAlt size={logoSize} className='mx-2' />
  };

  const extensionMap: { [key: string]: string } = {
    // Images
    png: 'image',
    jpg: 'image',
    jpeg: 'image',
    svg: 'image',
    webp: 'image',
    ico: 'image',
    bmp: 'image',
    tiff: 'image',
    tif: 'image',
    heic: 'image',
    heif: 'image',
    avif: 'image',
    raw: 'image',
    cr2: 'image',
    nef: 'image',
    arw: 'image',
    psd: 'photoshop',
    ai: 'photoshop',
    xd: 'photoshop',
    xcf: 'gimp',
    // Documents
    pdf: 'pdf',
    txt: 'text',
    rtf: 'msword',
    epub: 'msword',
    mobi: 'msword',
    tex: 'code',
    xps: 'msword',
    // Archives
    rar: 'archive',
    zip: 'archive',
    tar: 'archive',
    gz: 'archive',
    '7z': 'archive',
    xz: 'archive',
    bz2: 'archive',
    lz: 'archive',
    lzma: 'archive',
    zst: 'archive',
    // Web
    html: 'html',
    css: 'css',
    scss: 'css',
    sass: 'css',
    less: 'css',
    styl: 'css',
    // Audio
    mp3: 'audio',
    opus: 'audio',
    wav: 'audio',
    flac: 'audio',
    alac: 'audio',
    aac: 'audio',
    m4a: 'audio',
    ogg: 'audio',
    wma: 'audio',
    aiff: 'audio',
    mid: 'audio',
    midi: 'audio',
    ape: 'audio',
    // Video
    mp4: 'video',
    mkv: 'video',
    avi: 'video',
    mov: 'video',
    wmv: 'video',
    flv: 'video',
    webm: 'video',
    m4v: 'video',
    mpg: 'video',
    mpeg: 'video',
    '3gp': 'video',
    ogv: 'video',
    // Java
    java: 'java',
    jar: 'java',
    // JavaScript / TypeScript
    js: 'javascript',
    ts: 'javascript',
    mjs: 'javascript',
    // React (tsx, jsx)
    tsx: 'react',
    jsx: 'react',
    // Vue & Svelte
    vue: 'vue',
    svelte: 'svelte',
    // C#
    cs: 'csharp',
    // C / C++
    c: 'c',
    h: 'code',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    hpp: 'cpp',
    hh: 'cpp',
    hxx: 'cpp',
    // Assembly / Binary
    asm: 'binary',
    s: 'binary',
    bin: 'binary',
    o: 'binary',
    obj: 'binary',
    // Fortran
    f: 'fortran',
    f77: 'fortran',
    f90: 'fortran',
    f95: 'fortran',
    f03: 'fortran',
    f08: 'fortran',
    for: 'fortran',
    // Pascal / Delphi
    pas: 'code',
    pp: 'code',
    dpr: 'delphi',
    dpk: 'delphi',
    // Haskell
    hs: 'haskell',
    lhs: 'haskell',
    // Zig
    zig: 'zig',
    // Solidity
    sol: 'solidity',
    // Executables
    exe: 'exe',
    dll: 'windows',
    msi: 'windows',
    cab: 'windows',
    msix: 'windows',
    sys: 'windows',
    // Databases
    db: 'database',
    db3: 'database',
    mdb: 'database',
    accdb: 'database',
    dbf: 'database',
    sqlite: 'database',
    sqlite3: 'database',
    csv: 'database',
    tsv: 'database',
    sql: 'database',
    sqlitedb: 'database',
    // JSON
    json: 'json',
    // Shell
    sh: 'shell',
    bat: 'shell',
    cmd: 'shell',
    bash: 'shell',
    zsh: 'shell',
    fish: 'shell',
    ksh: 'shell',
    csh: 'shell',
    ps1: 'shell',
    psm1: 'shell',
    psd1: 'shell',
    // MS Office
    docx: 'msword',
    dotx: 'msword',
    doc: 'msword',
    odt: 'msword',
    xls: 'msexcel',
    xlsx: 'msexcel',
    ods: 'msexcel',
    pptx: 'mspowerpoint',
    ppt: 'mspowerpoint',
    odp: 'mspowerpoint',
    // Code
    xml: 'code',
    htmx: 'code',
    // PHP
    php: 'php',
    // Config
    config: 'config',
    ini: 'config',
    yml: 'config',
    yaml: 'config',
    conf: 'config',
    cfg: 'config',
    properties: 'config',
    env: 'dotenv',
    toml: 'toml',
    // Python
    py: 'python',
    ipynb: 'python',
    // Markdown
    md: 'markdown',
    mdx: 'markdown',
    // Go
    go: 'golang',
    mod: 'golang',
    sum: 'golang',
    // Gradle
    gradle: 'gradle',
    // ISO
    iso: 'iso',
    img: 'iso',
    // Blender
    blend: 'blender',
    blend1: 'blender',
    blend2: 'blender',
    // Android
    apk: 'apk',
    aab: 'apk',
    xapk: 'apk',
    // Blockbench
    bbmodel: 'blockbench',
    // Godot
    godot: 'godot',
    tscn: 'godot',
    gd: 'godot',
    tres: 'godot',
    // Ruby
    rb: 'ruby',
    erb: 'ruby',
    // Lua
    lua: 'lua',
    // Swift
    swift: 'swift',
    // Visual Basic
    vb: 'visualbasic',
    vbs: 'visualbasic',
    bas: 'visualbasic',
    // Elixir
    ex: 'elixir',
    exs: 'elixir',
    // Kotlin
    kt: 'kotlin',
    kts: 'kotlin',
    // Rust
    rs: 'rust',
    // Scala
    scala: 'scala',
    sc: 'scala',
    // Perl
    pl: 'perl',
    pm: 'perl',
    // F#
    fs: 'fsharp',
    fsx: 'fsharp',
    fsi: 'fsharp',
    // Dart
    dart: 'dart',
    // 3D Models
    fbx: 'cube3d',
    dae: 'cube3d',
    gltf: 'cube3d',
    glb: 'cube3d',
    stl: 'cube3d',
    '3ds': 'cube3d',
    obj3d: 'cube3d',
    step: 'cube3d',
    stp: 'cube3d',
    iges: 'cube3d',
    igs: 'cube3d',
    gcode: 'cube3d',
    // Fonts
    ttf: 'font',
    otf: 'font',
    woff: 'font',
    woff2: 'font',
    eot: 'font',
    // Certificates / Keys
    pem: 'certificate',
    crt: 'certificate',
    cer: 'certificate',
    key: 'certificate',
    pub: 'certificate',
    p12: 'certificate',
    pfx: 'certificate',
    gpg: 'certificate',
    asc: 'certificate',
    // Scientific / Data
    mat: 'scientific',
    h5: 'scientific',
    hdf5: 'scientific',
    nc: 'scientific',
    rdata: 'scientific',
    rds: 'scientific',
    parquet: 'scientific',
    arrow: 'scientific',
    // Torrent
    torrent: 'torrent',
    // Debian
    deb: 'debian',
    // Fedora / RPM
    rpm: 'fedora',
    // AppImage
    appimage: 'appimage',
    // Snap
    snap: 'snapcraft',
    // Disk Images
    vhd: 'iso',
    vhdx: 'iso',
    vmdk: 'iso',
    qcow2: 'iso',
    vdi: 'iso',
    // Logs / Backups
    log: 'text',
    bak: 'archive',
    tmp: 'text',
    temp: 'text',
    swp: 'text',
    // Other
    torrentfile: 'torrent',
  };


  if (!itemInfo) return icons.default;

  const { isDirectory, path, name } = itemInfo;
  const currentPath = path.slice(-1) === "/" ? path : path + "/";

  if (isDirectory) {
    return path === currentPath ? icons.folderOpen : icons.folder;
  }

  const extension = name?.split('.').pop()?.toLowerCase();
  if (!extension) {
    return null
  }
  const iconType = extensionMap[extension] || 'default';

  return icons[iconType];
};