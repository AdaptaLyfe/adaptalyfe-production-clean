import '../models/sleep_models.dart';
import 'sleep_api.dart';

class SleepRepository {
  const SleepRepository(this.api);

  final SleepApi api;

  Future<List<SleepSessionModel>> getSessions() => api.getSessions();

  Future<SleepSessionModel> getSessionByDate(String sleepDate) =>
      api.getSessionByDate(sleepDate);

  Future<SleepSessionModel> createSession(SleepSessionInput input) =>
      api.createSession(input);

  Future<SleepSessionModel> updateSession(
    int id,
    SleepSessionInput input,
  ) =>
      api.updateSession(id, input);

  Future<void> deleteSession(int id) => api.deleteSession(id);
}