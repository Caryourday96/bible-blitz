import { normalize, scramble } from './scramble';
import type { Category, Difficulty, Question } from './types';

// Names and book titles, not quotations. Source/validation notes: docs/QUESTION_SOURCES.md.
// Tags are intentionally overlapping so category combinations never repeat a name.
const records: { names: string; categories: Category[]; difficulty: Difficulty }[] = [
  {
    names:
      'Adam|Eve|Noah|Abraham|Sarah|Isaac|Jacob|Joseph|Moses|Aaron|Joshua|Caleb|Gideon|Samson|Samuel|David|Solomon|Daniel|Jonah',
    categories: ['Bible Characters', 'Old Testament'],
    difficulty: 'Easy',
  },
  {
    names:
      'Abel|Cain|Seth|Enoch|Lot|Esau|Levi|Judah|Benjamin|Reuben|Simeon|Naphtali|Asher|Gad|Dan|Ephraim|Manasseh|Eli|Jethro|Boaz|Jesse|Saul|Jonathan|Absalom|Nathan|Job|Ezra|Nehemiah|Elijah|Elisha|Isaiah|Jeremiah|Ezekiel',
    categories: ['Bible Characters', 'Old Testament'],
    difficulty: 'Medium',
  },
  {
    names:
      'Methuselah|Lamech|Ishmael|Laban|Balaam|Balak|Korah|Phinehas|Hophni|Abimelech|Jephthah|Ehud|Barak|Shamgar|Othniel|Abner|Joab|Amasa|Ahithophel|Adonijah|Zadok|Hiram|Gehazi|Naaman|Mordecai|Haman|Shadrach|Meshach|Abednego|Zerubbabel',
    categories: ['Bible Characters', 'Old Testament'],
    difficulty: 'Hard',
  },
  {
    names:
      'Melchizedek|Mephibosheth|Nebuchadnezzar|Belshazzar|Zelophehad|Bezalel|Oholiab|Mahershalalhashbaz|Shealtiel|Sheshbazzar|Tiglathpileser|Sennacherib|Rabshakeh|Jehoiachin|Zedekiah|Artaxerxes|Ahasuerus|Benaiah|Jehozadak|Jeduthun|Mahalaleel|Jerahmeel',
    categories: ['Bible Characters', 'Old Testament', 'Difficult Bible Names'],
    difficulty: 'Expert',
  },
  {
    names: 'Jesus|Peter|Paul|John|James|Matthew|Mark|Luke|Thomas|Timothy|Stephen',
    categories: ['Bible Characters', 'New Testament'],
    difficulty: 'Easy',
  },
  {
    names:
      'Andrew|Philip|Bartholomew|Matthias|Barnabas|Silas|Titus|Lazarus|Zacchaeus|Nicodemus|Joseph of Arimathea|Simon|Apollos|Aquila|Cornelius|Ananias|Gamaliel',
    categories: ['Bible Characters', 'New Testament'],
    difficulty: 'Medium',
  },
  {
    names:
      'Nathanael|Thaddaeus|Judas Iscariot|Judas|Zebedee|Cleopas|Epaphroditus|Epaphras|Onesimus|Philemon|Tychicus|Trophimus|Eutychus|Sosthenes|Demas|Aristarchus|Simeon|Agabus|Sergius Paulus|Bartimaeus',
    categories: ['Bible Characters', 'New Testament'],
    difficulty: 'Hard',
  },
  {
    names: 'Eve|Sarah|Rebekah|Rachel|Leah|Miriam|Deborah|Ruth|Naomi|Esther|Hannah|Mary|Martha',
    categories: ['Women of the Bible'],
    difficulty: 'Easy',
  },
  {
    names:
      'Abigail|Bathsheba|Rahab|Delilah|Hagar|Elizabeth|Anna|Lydia|Priscilla|Phoebe|Tabitha|Dorcas|Salome|Joanna|Susanna|Mary Magdalene',
    categories: ['Women of the Bible'],
    difficulty: 'Medium',
  },
  {
    names:
      'Jochebed|Zipporah|Mahlah|Tirzah|Huldah|Jezebel|Athaliah|Sapphira|Lois|Eunice|Keturah|Dinah|Tamar|Orpah|Jael|Shiphrah|Puah|Damaris|Euodias|Syntyche',
    categories: ['Women of the Bible'],
    difficulty: 'Hard',
  },
  {
    names:
      'Isaiah|Jeremiah|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Elijah|Elisha|Nathan|Samuel',
    categories: ['Prophets'],
    difficulty: 'Medium',
  },
  {
    names:
      'Saul|David|Solomon|Esther|Jezebel|Athaliah|Hezekiah|Josiah|Ahab|Rehoboam|Jeroboam|Jehoshaphat|Asa|Amaziah|Uzziah|Jotham|Ahaz|Jehu|Omri|Darius|Cyrus|Herod|Agrippa',
    categories: ['Kings and Queens'],
    difficulty: 'Hard',
  },
  {
    names:
      'Peter|Andrew|James|John|Philip|Bartholomew|Thomas|Matthew|Simon|Judas Iscariot|Matthias|Thaddaeus|Mary Magdalene|Paul|Barnabas|Timothy|Silas',
    categories: ['Apostles and Disciples'],
    difficulty: 'Medium',
  },
  {
    names:
      'Eden|Egypt|Israel|Jerusalem|Bethlehem|Nazareth|Galilee|Jordan|Jericho|Canaan|Sinai|Babylon|Nineveh|Bethany|Zion|Samaria',
    categories: ['Biblical Places'],
    difficulty: 'Easy',
  },
  {
    names:
      'Bethsaida|Capernaum|Gethsemane|Golgotha|Emmaus|Damascus|Antioch|Corinth|Ephesus|Philippi|Thessalonica|Rome|Patmos|Joppa|Caesarea|Tyre|Sidon|Tarsus|Berea|Lystra|Derbe|Troas|Cyprus|Crete|Cana|Hebron|Beersheba|Bethel|Shechem|Shiloh|Sodom|Gomorrah|Moab|Edom|Gilead|Gilgal|Megiddo|Mount Carmel|Mount Nebo|Red Sea|Dead Sea|Sea of Galilee|Mount of Olives',
    categories: ['Biblical Places'],
    difficulty: 'Medium',
  },
  {
    names:
      'Mesopotamia|Cappadocia|Laodicea|Philadelphia|Thyatira|Sardis|Smyrna|Pergamum|Decapolis|Arimathea|En Gedi|Kadesh Barnea|Bethphage|Aceldama',
    categories: ['Biblical Places', 'Difficult Bible Names'],
    difficulty: 'Expert',
  },
  {
    names:
      'Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi',
    categories: ['Books of the Bible', 'Old Testament'],
    difficulty: 'Medium',
  },
  {
    names:
      'Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation',
    categories: ['Books of the Bible', 'New Testament'],
    difficulty: 'Medium',
  },
];
const aliases: Record<string, string[]> = {
  Zacchaeus: ['Zaccheus'],
  Bartimaeus: ['Bartimeus'],
  Elizabeth: ['Elisabeth'],
  Phoebe: ['Phebe'],
  Arimathea: ['Arimathaea'],
  'Joseph of Arimathea': ['Joseph of Arimathaea'],
  'Dead Sea': ['Salt Sea'],
  Rebekah: ['Rebecca'],
  Oholiab: ['Aholiab'],
  Bezalel: ['Bezaleel'],
  Jehozadak: ['Josedech'],
  Mahalaleel: ['Mahalalel'],
  Nebuchadnezzar: ['Nebuchadrezzar'],
  'Song of Solomon': ['Song of Songs', 'Canticles'],
  Psalms: ['Psalm'],
  Revelation: ['Revelations'],
  'En Gedi': ['Engedi', 'En-gedi'],
  Pergamum: ['Pergamos'],
  Euodias: ['Euodia'],
  Nathanael: ['Nathaniel'],
  Tiglathpileser: ['Tiglath-pileser', 'Tilgathpilneser'],
  Mahershalalhashbaz: ['Maher-shalal-hash-baz'],
  'Kadesh Barnea': ['Kadeshbarnea'],
};
const map = new Map<string, Question>();
for (const record of records) {
  for (const answer of record.names.split('|')) {
    const key = normalize(answer);
    const current = map.get(key);
    if (current) {
      current.categories = [...new Set([...current.categories, ...record.categories])];
      continue;
    }
    const accepted = [...(aliases[answer] ?? [])];
    if (/^[123] /.test(answer)) {
      const n = Number(answer[0]);
      const title = answer.slice(2);
      accepted.push(
        `${['', 'First', 'Second', 'Third'][n]} ${title}`,
        `${['', 'I', 'II', 'III'][n]} ${title}`,
      );
    }
    map.set(key, {
      id: `bb-${key.toLowerCase()}`,
      answer,
      aliases: accepted,
      categories: [...record.categories],
      difficulty: record.difficulty,
      scrambled: scramble(answer, () => 0.37),
    });
  }
}
const newTestamentWomen = new Set(
  'Mary|Martha|Elizabeth|Anna|Lydia|Priscilla|Phoebe|Tabitha|Dorcas|Salome|Joanna|Susanna|Mary Magdalene|Sapphira|Lois|Eunice|Damaris|Euodias|Syntyche'.split(
    '|',
  ),
);
for (const q of map.values()) {
  if (
    q.categories.some((c) =>
      ['Women of the Bible', 'Prophets', 'Kings and Queens', 'Apostles and Disciples'].includes(c),
    )
  )
    q.categories = [...new Set([...q.categories, 'Bible Characters' as Category])];
  if (q.categories.includes('Women of the Bible'))
    q.categories = [
      ...new Set([
        ...q.categories,
        newTestamentWomen.has(q.answer)
          ? ('New Testament' as Category)
          : ('Old Testament' as Category),
      ]),
    ];
}
export const questions: Question[] = [...map.values()];
