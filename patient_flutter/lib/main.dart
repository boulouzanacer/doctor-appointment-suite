import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:audioplayers/audioplayers.dart';

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Notifications
  const AndroidInitializationSettings initializationSettingsAndroid = AndroidInitializationSettings('@mipmap/ic_launcher');
  const InitializationSettings initializationSettings = InitializationSettings(android: initializationSettingsAndroid);
  await flutterLocalNotificationsPlugin.initialize(initializationSettings);

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
          appId: "1:342025821668:android:e2efc42bc75137842b7bf1"
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
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Card(
                elevation: 12,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                child: Padding(
                  padding: const EdgeInsets.all(32.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0F766E).withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(LucideIcons.activity, size: 40, color: Color(0xFF0F766E)),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        'Cabinet Médical',
                        style: GoogleFonts.manrope(fontSize: 24, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Suivez votre tour en temps réel',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.manrope(color: Colors.grey[600]),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: () async {
                          final result = await Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const QRScannerScreen()),
                          );
                          if (result != null) {
                            setState(() => patientId = result);
                          }
                        },
                        icon: const Icon(LucideIcons.scanLine),
                        label: const Text('Scanner mon ticket'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0F766E),
                          foregroundColor: Colors.white,
                          minimumSize: const Size(double.infinity, 50),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
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

    return PatientStatusView(
      patientId: patientId!,
      onLogout: () => setState(() => patientId = null),
    );
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

  const PatientStatusView({super.key, required this.patientId, required this.onLogout});

  @override
  State<PatientStatusView> createState() => _PatientStatusViewState();
}

class _PatientStatusViewState extends State<PatientStatusView> {
  final AudioPlayer _audioPlayer = AudioPlayer();
  bool _notificationSent = false;

  Future<void> _notifyArrival() async {
    if (_notificationSent) return;
    
    // Play sound
    await _audioPlayer.play(AssetSource('sounds/notification.mp3'));
    
    // Show notification
    const AndroidNotificationDetails androidPlatformChannelSpecifics = AndroidNotificationDetails(
      'your_turn_channel',
      'Votre tour',
      importance: Importance.max,
      priority: Priority.high,
      playSound: true,
    );
    const NotificationDetails platformChannelSpecifics = NotificationDetails(android: androidPlatformChannelSpecifics);
    await flutterLocalNotificationsPlugin.show(
      0,
      'C\'est votre tour !',
      'Veuillez vous diriger vers la salle de consultation.',
      platformChannelSpecifics,
    );

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

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: const Text('Mon Passage', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [IconButton(onPressed: widget.onLogout, icon: const Icon(LucideIcons.logOut))],
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('queue')
            .where('date', isEqualTo: today)
            .orderBy('time')
            .snapshots(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          
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
                  TextButton(onPressed: widget.onLogout, child: const Text('Retour'))
                ],
              ),
            );
          }

          final int position = myIndex + 1;
          final int remaining = myIndex; // Number of people before me

          // Trigger notification if position is 1
          if (position == 1 && myData?['status'] != 'treated') {
            _notifyArrival();
          }

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Position Card
              _buildMainPositionCard(position, remaining, myData?['status']),
              const SizedBox(height: 20),
              
              // Queue List
              const Text('File d\'attente du jour', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              ...queueDocs.asMap().entries.map((entry) {
                final int idx = entry.key;
                final data = entry.value.data() as Map<String, dynamic>;
                final bool isMe = data['patientId'] == widget.patientId;
                
                return _buildQueueItem(idx + 1, data, isMe);
              }),
            ],
          );
        },
      ),
    );
  }

  Widget _buildMainPositionCard(int position, int remaining, String? status) {
    bool isNext = position == 1;
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isNext 
            ? [const Color(0xFF0D9488), const Color(0xFF0F766E)]
            : [Colors.white, Colors.white],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
      ),
      child: Column(
        children: [
          Text(
            isNext ? 'C\'est votre tour !' : 'Votre Position',
            style: TextStyle(
              color: isNext ? Colors.white70 : Colors.grey[600],
              fontSize: 16,
              fontWeight: FontWeight.w600
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '$position',
            style: TextStyle(
              fontSize: 72, 
              fontWeight: FontWeight.w800, 
              color: isNext ? Colors.white : const Color(0xFF0F766E)
            ),
          ),
          const SizedBox(height: 8),
          if (!isNext)
            Text(
              '$remaining patient(s) avant vous',
              style: TextStyle(color: Colors.grey[600], fontWeight: FontWeight.w500),
            ),
          if (isNext)
            const Text(
              'Le docteur vous attend',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          const SizedBox(height: 16),
          _StatusBadge(status: status ?? 'waiting', onDark: isNext),
        ],
      ),
    );
  }

  Widget _buildQueueItem(int pos, Map<String, dynamic> data, bool isMe) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isMe ? const Color(0xFF0F766E).withOpacity(0.05) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: isMe ? Border.all(color: const Color(0xFF0F766E), width: 2) : null,
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
                  fontWeight: FontWeight.bold
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
                  isMe ? 'Vous' : '${data['firstName']} ${data['lastName'][0]}.',
                  style: TextStyle(
                    fontWeight: isMe ? FontWeight.bold : FontWeight.w500,
                    fontSize: 15
                  ),
                ),
                Text(data['time'], style: TextStyle(color: Colors.grey[500], fontSize: 13)),
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
  
  const _StatusBadge({required this.status, this.compact = false, this.onDark = false});

  @override
  Widget build(BuildContext context) {
    final styles = {
      'waiting': (color: Colors.orange, label: 'Attente'),
      'confirmed': (color: Colors.blue, label: 'Confirmé'),
      'treated': (color: Colors.green, label: 'Terminé'),
      'cancelled': (color: Colors.red, label: 'Annulé'),
    }[status] ?? (color: Colors.grey, label: status);

    return Container(
      padding: EdgeInsets.symmetric(horizontal: compact ? 8 : 12, vertical: 4),
      decoration: BoxDecoration(
        color: onDark ? Colors.white.withOpacity(0.2) : styles.color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        styles.label,
        style: TextStyle(
          color: onDark ? Colors.white : styles.color, 
          fontWeight: FontWeight.bold, 
          fontSize: compact ? 10 : 12
        ),
      ),
    );
  }
}