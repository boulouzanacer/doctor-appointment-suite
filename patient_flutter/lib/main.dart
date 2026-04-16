import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:shared_preferences/shared_preferences.dart';

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Notifications for Android (v17 style)
  const AndroidInitializationSettings initializationSettingsAndroid =
      AndroidInitializationSettings('@mipmap/ic_launcher');
  const InitializationSettings initializationSettings = InitializationSettings(
    android: initializationSettingsAndroid,
  );

  try {
    await flutterLocalNotificationsPlugin.initialize(initializationSettings);
    debugPrint("Notifications initialized");
  } catch (e) {
    debugPrint("Error initializing notifications: $e");
  }

  debugPrint("--- Starting App Initialization ---");

  try {
    await Firebase.initializeApp().timeout(
      const Duration(seconds: 10),
      onTimeout: () => Firebase.app(),
    );
    debugPrint("Firebase initialized successfully");
  } catch (e) {
    debugPrint("Firebase initialization error: $e");
    try {
      await Firebase.initializeApp(
        options: const FirebaseOptions(
          apiKey: "AIzaSyCTvGSJwG06gnKK-d9sgtYX8oGgxCWhfqc",
          authDomain: "doctor-appointment-suite.firebaseapp.com",
          projectId: "doctor-appointment-suite",
          storageBucket: "doctor-appointment-suite.firebasestorage.app",
          messagingSenderId: "342025821668",
          appId: "1:342025821668:android:e2efc42bc75137842b7bf1",
        ),
      );
    } catch (e2) {
      debugPrint("Manual Firebase initialization failed: $e2");
    }
  }

  runApp(const PatientApp());
}

class PatientApp extends StatelessWidget {
  const PatientApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Cabinet Patient',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0F766E)),
        textTheme: GoogleFonts.manropeTextTheme(),
      ),
      home: const PatientHomeScreen(),
    );
  }
}

class PatientHomeScreen extends StatefulWidget {
  const PatientHomeScreen({super.key});

  @override
  State<PatientHomeScreen> createState() => _PatientHomeScreenState();
}

class _PatientHomeScreenState extends State<PatientHomeScreen> {
  String? patientId;
  final TextEditingController _idController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadPatientId();
  }

  Future<void> _loadPatientId() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      patientId = prefs.getString('patient_id');
    });
  }

  Future<void> _savePatientId(String id) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('patient_id', id);
    setState(() {
      patientId = id;
    });
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('patient_id');
    setState(() {
      patientId = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (patientId == null) {
      return Scaffold(
        body: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF0F766E), Color(0xFF134E4A)],
            ),
          ),
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Card(
                elevation: 12,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(32.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0F766E).withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          LucideIcons.activity,
                          size: 40,
                          color: Color(0xFF0F766E),
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        'Cabinet Médical',
                        style: GoogleFonts.manrope(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Suivez votre tour en temps réel',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.manrope(color: Colors.grey[600]),
                      ),
                      const SizedBox(height: 32),
                      // QR Scanner Button
                      ElevatedButton.icon(
                        onPressed: () async {
                          final result = await Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const QRScannerScreen(),
                            ),
                          );
                          if (result != null) {
                            _savePatientId(result);
                          }
                        },
                        icon: const Icon(LucideIcons.scanLine),
                        label: const Text('Scanner mon ticket'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0F766E),
                          foregroundColor: Colors.white,
                          minimumSize: const Size(double.infinity, 56),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          Expanded(child: Divider(color: Colors.grey[300])),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Text(
                              'OU',
                              style: TextStyle(
                                color: Colors.grey[400],
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          Expanded(child: Divider(color: Colors.grey[300])),
                        ],
                      ),
                      const SizedBox(height: 20),
                      // Manual Entry Field
                      TextField(
                        controller: _idController,
                        decoration: InputDecoration(
                          hintText: 'Entrez votre code patient (ex: PAT-...)',
                          prefixIcon: const Icon(LucideIcons.key),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          filled: true,
                          fillColor: Colors.grey[50],
                        ),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: () {
                          if (_idController.text.trim().isNotEmpty) {
                            _savePatientId(_idController.text.trim());
                            _idController.clear();
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: const Color(0xFF0F766E),
                          minimumSize: const Size(double.infinity, 50),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                            side: const BorderSide(color: Color(0xFF0F766E)),
                          ),
                        ),
                        child: const Text('Entrer manuellement'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    }

    return PatientStatusView(patientId: patientId!, onLogout: _logout);
  }
}

class QRScannerScreen extends StatelessWidget {
  const QRScannerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scanner le QR Code')),
      body: MobileScanner(
        onDetect: (capture) {
          final List<Barcode> barcodes = capture.barcodes;
          for (final barcode in barcodes) {
            if (barcode.rawValue != null) {
              Navigator.pop(context, barcode.rawValue);
              break;
            }
          }
        },
      ),
    );
  }
}

class PatientStatusView extends StatefulWidget {
  final String patientId;
  final VoidCallback onLogout;

  const PatientStatusView({
    super.key,
    required this.patientId,
    required this.onLogout,
  });

  @override
  State<PatientStatusView> createState() => _PatientStatusViewState();
}

class _PatientStatusViewState extends State<PatientStatusView> {
  final AudioPlayer _audioPlayer = AudioPlayer();
  bool _notificationSent = false;

  Future<void> _notifyArrival() async {
    if (_notificationSent) return;

    try {
      await _audioPlayer.play(AssetSource('sounds/notification.mp3'));
    } catch (e) {
      debugPrint("Error playing sound: $e");
    }

    try {
      // v17 style notification details
      const AndroidNotificationDetails androidPlatformChannelSpecifics =
          AndroidNotificationDetails(
            'your_turn_channel',
            'Votre tour',
            channelDescription: 'Notifications pour votre tour de passage',
            importance: Importance.max,
            priority: Priority.high,
            ticker: 'ticker',
          );
      const NotificationDetails platformChannelSpecifics = NotificationDetails(
        android: androidPlatformChannelSpecifics,
      );

      await flutterLocalNotificationsPlugin.show(
        0,
        'C\'est votre tour !',
        'Veuillez vous diriger vers la salle de consultation.',
        platformChannelSpecifics,
      );
    } catch (e) {
      debugPrint("Error showing notification: $e");
    }

    setState(() => _notificationSent = true);
  }

  @override
  void dispose() {
    _audioPlayer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final String today = DateFormat('yyyy-MM-dd').format(DateTime.now());

    return StreamBuilder<DocumentSnapshot>(
      stream: FirebaseFirestore.instance
          .collection('app_settings')
          .doc('global')
          .snapshots(),
      builder: (context, settingsSnapshot) {
        final bool showNames =
            (settingsSnapshot.data?.data()
                as Map<String, dynamic>?)?['showPatientNames'] ??
            true;

        return Scaffold(
          backgroundColor: const Color(0xFFF1F5F9),
          appBar: AppBar(
            title: const Text(
              'Mon Passage',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            actions: [
              IconButton(
                onPressed: widget.onLogout,
                icon: const Icon(LucideIcons.logOut),
              ),
            ],
          ),
          body: StreamBuilder<QuerySnapshot>(
            stream: FirebaseFirestore.instance
                .collection('queue')
                .where('date', isEqualTo: today)
                .orderBy('time')
                .snapshots(),
            builder: (context, snapshot) {
              if (snapshot.hasError) {
                return Center(child: Text('Erreur: ${snapshot.error}'));
              }
              if (!snapshot.hasData) {
                return const Center(child: CircularProgressIndicator());
              }

              final queueDocs = snapshot.data!.docs;
              int myIndex = -1;
              Map<String, dynamic>? myData;

              for (int i = 0; i < queueDocs.length; i++) {
                final data = queueDocs[i].data() as Map<String, dynamic>;
                if (data['patientId'] == widget.patientId) {
                  myIndex = i;
                  myData = data;
                  break;
                }
              }

              if (myIndex == -1) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Aucun rendez-vous aujourd\'hui'),
                      TextButton(
                        onPressed: widget.onLogout,
                        child: const Text('Retour'),
                      ),
                    ],
                  ),
                );
              }

              // Calculate "remaining" - patients before me who are NOT treated
              int remaining = 0;
              for (int i = 0; i < myIndex; i++) {
                final data = queueDocs[i].data() as Map<String, dynamic>;
                if (data['status'] != 'treated') {
                  remaining++;
                }
              }

              final int position = remaining + 1;

              if (position == 1 && myData?['status'] != 'treated') {
                _notifyArrival();
              }

              return ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _buildMainPositionCard(
                    position,
                    remaining,
                    myData?['status'],
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'File d\'attente du jour',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  ...queueDocs.asMap().entries.map((entry) {
                    final int idx = entry.key;
                    final data = entry.value.data() as Map<String, dynamic>;
                    final bool isMe = data['patientId'] == widget.patientId;
                    final bool isTreated = data['status'] == 'treated';

                    // Logic for position in list: count non-treated patients up to this one
                    int listPos = 0;
                    for (int i = 0; i <= idx; i++) {
                      if ((queueDocs[i].data()
                              as Map<String, dynamic>)['status'] !=
                          'treated') {
                        listPos++;
                      }
                    }

                    return _buildQueueItem(
                      isTreated ? 0 : listPos,
                      data,
                      isMe,
                      showNames,
                    );
                  }),
                ],
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildMainPositionCard(int position, int remaining, String? status) {
    bool isTreated = status == 'treated';
    bool isNext = position == 1 && !isTreated;
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isTreated
              ? [const Color(0xFF059669), const Color(0xFF047857)]
              : (isNext
                    ? [const Color(0xFF0D9488), const Color(0xFF0F766E)]
                    : [Colors.white, Colors.white]),
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            isTreated
                ? 'Statut'
                : (isNext ? 'C\'est votre tour !' : 'Votre Position'),
            style: TextStyle(
              color: (isNext || isTreated) ? Colors.white70 : Colors.grey[600],
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            isTreated ? 'TERMINÉ' : '$position',
            style: TextStyle(
              fontSize: isTreated ? 40 : 72,
              fontWeight: FontWeight.w800,
              color: (isNext || isTreated)
                  ? Colors.white
                  : const Color(0xFF0F766E),
            ),
          ),
          const SizedBox(height: 8),
          if (!isNext && !isTreated)
            Text(
              '$remaining patient(s) avant vous',
              style: TextStyle(
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
          if (isNext)
            const Text(
              'Le docteur vous attend',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          if (isTreated)
            const Text(
              'Vous avez été traité',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          const SizedBox(height: 16),
          _StatusBadge(
            status: status ?? 'waiting',
            onDark: isNext || isTreated,
          ),
        ],
      ),
    );
  }

  Widget _buildQueueItem(
    int pos,
    Map<String, dynamic> data,
    bool isMe,
    bool showNames,
  ) {
    return Container(
      key: ValueKey(data['id'] ?? pos),
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isMe
            ? const Color(0xFF0F766E).withValues(alpha: 0.05)
            : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: isMe
            ? Border.all(color: const Color(0xFF0F766E), width: 2)
            : null,
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: isMe ? const Color(0xFF0F766E) : Colors.grey[200],
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '$pos',
                style: TextStyle(
                  color: isMe ? Colors.white : Colors.grey[600],
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isMe
                      ? 'Vous'
                      : (showNames
                            ? '${data['firstName']} ${data['lastName']}'
                            : 'Patient $pos'),
                  style: TextStyle(
                    fontWeight: isMe ? FontWeight.bold : FontWeight.w500,
                    fontSize: 15,
                  ),
                ),
                Text(
                  data['time'] ?? '--:--',
                  style: TextStyle(color: Colors.grey[500], fontSize: 13),
                ),
              ],
            ),
          ),
          _StatusBadge(status: data['status'] ?? 'waiting', compact: true),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  final bool compact;
  final bool onDark;

  const _StatusBadge({
    required this.status,
    this.compact = false,
    this.onDark = false,
  });

  @override
  Widget build(BuildContext context) {
    final styles =
        {
          'waiting': (color: Colors.orange, label: 'Attente'),
          'confirmed': (color: Colors.blue, label: 'Confirmé'),
          'treated': (color: Colors.green, label: 'Terminé'),
          'cancelled': (color: Colors.red, label: 'Annulé'),
        }[status] ??
        (color: Colors.grey, label: status);

    return Container(
      padding: EdgeInsets.symmetric(horizontal: compact ? 8 : 12, vertical: 4),
      decoration: BoxDecoration(
        color: onDark
            ? Colors.white.withValues(alpha: 0.2)
            : styles.color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        styles.label,
        style: TextStyle(
          color: onDark ? Colors.white : styles.color,
          fontWeight: FontWeight.bold,
          fontSize: compact ? 10 : 12,
        ),
      ),
    );
  }
}
